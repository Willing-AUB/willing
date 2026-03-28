import { TextSearch, type LucideIcon } from 'lucide-react';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  buildSharedPostingQuery,
  hasSharedAdvancedPostingFilters,
  organizationPostingSortOptions,
  resolveOrganizationPostingSortOption,
  resolveVolunteerPostingSortOption,
  toOrganizationPostingSortOptionValue,
  toVolunteerPostingSortOptionValue,
  volunteerPostingSortOptions,
  type PostingSortDir,
  type SharedPostingFilterFields,
  type OrganizationPostingSortBy,
  type OrganizationPostingSortOptionValue,
  type VolunteerPostingSortBy,
  type VolunteerPostingSortOptionValue,
} from './postingFilterConfig.ts';
import { FormField } from '../../utils/formUtils.tsx';
import requestServer, { SERVER_BASE_URL } from '../../utils/requestServer.ts';
import useAsync from '../../utils/useAsync';
import CalendarInfo from '../CalendarInfo.tsx';
import Card from '../Card.tsx';
import EmptyState from '../EmptyState.tsx';
import PageContainer from '../layout/PageContainer.tsx';
import PageHeader from '../layout/PageHeader.tsx';
import Loading from '../Loading.tsx';
import PostingCollection from './PostingCollection.tsx';
import PostingFiltersCard from './PostingFiltersCard.tsx';

import type { VolunteerOrganizationSearchResponse, VolunteerPostingSearchResponse, VolunteerEnrollmentsResponse } from '../../../../server/src/api/types.ts';
import type { PostingWithContext } from '../../../../server/src/types.ts';

export type PostingSearchFilters = SharedPostingFilterFields & {
  sortBy: VolunteerPostingSortBy | OrganizationPostingSortBy;
  sortDir: PostingSortDir;
  startDateFrom: string;
  endDateTo: string;
  startTimeFrom: string;
  endTimeTo: string;
  hideFull: boolean;
  crisisId: 'all' | `${number}`;
  entity: 'postings' | 'organizations';
};

type PostingCrisisOption = {
  id: number;
  name: string;
};

type PostingSearchFormValues = Omit<PostingSearchFilters, 'sortBy' | 'sortDir'> & {
  sortOption: VolunteerPostingSortOptionValue | OrganizationPostingSortOptionValue;
  entity: PostingSearchFilters['entity'];
};

type VolunteerOrganizationSearchResult = {
  id: number;
  name: string;
  description: string | null;
  location_name: string | null;
  logo_path: string | null;
};

type PostingSearchViewProps = {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  badge?: ReactNode;
  actions?: ReactNode;
  showBack?: boolean;
  defaultBackTo?: string;
  initialFilters?: Partial<PostingSearchFilters>;
  emptyMessage?: string;
  filterPostings?: (postings: PostingWithContext[]) => PostingWithContext[];
  fetchUrl?: string;
  enableCrisisFilter?: boolean;
  crisisOptions?: PostingCrisisOption[];
  enableOrganizationSearch?: boolean;
  compact?: boolean;
};

const toPostingSearchFormValues = (filters: PostingSearchFilters): PostingSearchFormValues => ({
  search: filters.search,
  sortOption: filters.entity === 'organizations'
    ? toOrganizationPostingSortOptionValue(filters.sortBy as OrganizationPostingSortBy, filters.sortDir)
    : toVolunteerPostingSortOptionValue(filters.sortBy as VolunteerPostingSortBy, filters.sortDir),
  startDateFrom: filters.startDateFrom,
  endDateTo: filters.endDateTo,
  startTimeFrom: filters.startTimeFrom,
  endTimeTo: filters.endTimeTo,
  hideFull: filters.hideFull,
  crisisId: filters.crisisId,
  entity: filters.entity,
});

const fromPostingSearchFormValues = (values: PostingSearchFormValues): PostingSearchFilters => {
  const selectedSortOption = values.entity === 'organizations'
    ? resolveOrganizationPostingSortOption(values.sortOption as OrganizationPostingSortOptionValue)
    : resolveVolunteerPostingSortOption(values.sortOption as VolunteerPostingSortOptionValue);

  const querySortBy: VolunteerPostingSortBy | OrganizationPostingSortBy = values.entity === 'organizations'
    ? 'title'
    : (selectedSortOption.sortBy as VolunteerPostingSortBy);

  const querySortDir: PostingSortDir = values.entity === 'organizations'
    ? (selectedSortOption.sortDir as PostingSortDir)
    : selectedSortOption.sortDir;

  return {
    search: values.search,
    sortBy: querySortBy,
    sortDir: querySortDir,
    startDateFrom: values.startDateFrom,
    endDateTo: values.endDateTo,
    startTimeFrom: values.startTimeFrom,
    endTimeTo: values.endTimeTo,
    hideFull: values.hideFull,
    crisisId: values.crisisId,
    entity: values.entity,
  };
};

function PostingSearchView({
  title,
  subtitle,
  icon = TextSearch,
  badge,
  actions,
  showBack = false,
  defaultBackTo,
  initialFilters,
  emptyMessage = 'No postings found yet',
  filterPostings,
  fetchUrl,
  enableCrisisFilter = false,
  crisisOptions = [],
  enableOrganizationSearch = false,
  compact = false,
}: PostingSearchViewProps) {
  const defaultFilters = useMemo<PostingSearchFilters>(() => ({
    search: '',
    sortBy: 'recommended',
    sortDir: 'desc',
    startDateFrom: '',
    endDateTo: '',
    startTimeFrom: '',
    endTimeTo: '',
    hideFull: false,
    crisisId: 'all',
    entity: enableOrganizationSearch ? 'postings' : 'postings',
    ...initialFilters,
  }), [initialFilters, enableOrganizationSearch]);
  const defaultFormValues = useMemo(() => toPostingSearchFormValues(defaultFilters), [defaultFilters]);

  const [postings, setPostings] = useState<PostingWithContext[]>([]);
  const [organizations, setOrganizations] = useState<VolunteerOrganizationSearchResult[]>([]);
  const [activeEntity, setActiveEntity] = useState<PostingSearchFilters['entity']>(defaultFilters.entity);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { trigger: fetchPostingsRequest } = useAsync(
    async (url: string) => requestServer<VolunteerPostingSearchResponse | VolunteerEnrollmentsResponse>(url, { includeJwt: true }),
    { notifyOnError: true },
  );

  const fetchPostings = useCallback(async (activeFilters: PostingSearchFilters) => {
    const baseUrl = fetchUrl ?? '/volunteer/posting';
    const query = new URLSearchParams(buildSharedPostingQuery(activeFilters));
    if (activeFilters.hideFull) query.append('hide_full', 'true');
    if (activeFilters.crisisId !== 'all') query.append('crisis_id', activeFilters.crisisId);

    const separator = baseUrl.includes('?') ? '&' : '?';
    const url = query.size > 0 ? `${baseUrl}${separator}${query.toString()}` : baseUrl;

    setLoading(true);
    setError(null);

    try {
      const shouldFetchPostings = activeFilters.entity === 'postings';
      const shouldFetchOrgs = enableOrganizationSearch && activeFilters.entity === 'organizations';

      const postingPromise = shouldFetchPostings
        ? fetchPostingsRequest(url)
        : Promise.resolve({ postings: [] } as VolunteerPostingSearchResponse);

      const organizationsPromise = shouldFetchOrgs
        ? (() => {
            const orgQuery = new URLSearchParams();
            if (activeFilters.search) orgQuery.append('search', activeFilters.search);
            if (activeFilters.sortBy === 'title') {
              orgQuery.append('sort_by', 'title');
              orgQuery.append('sort_dir', activeFilters.sortDir);
            }
            const orgUrl = orgQuery.toString() ? `/volunteer/organizations?${orgQuery.toString()}` : '/volunteer/organizations';
            return requestServer<VolunteerOrganizationSearchResponse>(orgUrl, { includeJwt: true });
          })()
        : Promise.resolve({ organizations: [] });

      const [postingResponse, organizationResponse] = await Promise.all([postingPromise, organizationsPromise]);
      const postProcessFilteredPostings = filterPostings ? filterPostings(postingResponse.postings) : postingResponse.postings;
      setPostings(postProcessFilteredPostings);
      setOrganizations(organizationResponse.organizations);
    } catch (fetchError) {
      setPostings([]);
      setOrganizations([]);
      const message = fetchError instanceof Error ? fetchError.message : 'Failed to load postings';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fetchPostingsRequest, fetchUrl, filterPostings, enableOrganizationSearch]);

  const applyFilters = useCallback(async (formValues: PostingSearchFormValues) => {
    const filters = fromPostingSearchFormValues(formValues);
    setActiveEntity(filters.entity);
    await fetchPostings(filters);
  }, [fetchPostings]);

  return (
    <PageContainer>
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        badge={badge}
        actions={actions}
        showBack={showBack}
        defaultBackTo={defaultBackTo}
      />

      <PostingFiltersCard
        defaultValues={defaultFormValues}
        onApply={applyFilters}
        searchFieldName="search"
        searchPlaceholder="Search title, description, location, organization, or skills"
        sortFieldName="sortOption"
        sortOptions={volunteerPostingSortOptions.map(option => ({
          label: option.label,
          value: option.value,
        }))}
        organizationSortOptions={organizationPostingSortOptions
          .filter(option => option.value === 'title_asc' || option.value === 'title_desc')
          .map(option => ({
            label: option.label,
            value: option.value,
          }))}
        enableOrganizationSearch={enableOrganizationSearch}
        compact={compact}
        getHasAdvancedFiltersApplied={values => hasSharedAdvancedPostingFilters(values) || values.hideFull || values.crisisId !== 'all'}
        renderAdvancedFields={form => (
          <>
            <div className="lg:col-span-2">
              <CalendarInfo
                selectionMode="range"
                rangeLabel="Date Range"
                rangeValue={{
                  from: form.watch('startDateFrom') ?? '',
                  to: form.watch('endDateTo') ?? '',
                }}
                onRangeChange={({ from, to }) => {
                  form.setValue('startDateFrom', from, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                  form.setValue('endDateTo', to, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                }}
                className="w-full"
              />
            </div>

            <FormField
              form={form}
              name="startTimeFrom"
              label="Start Time After"
              type="time"
            />

            <FormField
              form={form}
              name="endTimeTo"
              label="End Time By"
              type="time"
            />

            {enableCrisisFilter && (
              <div className="lg:col-span-2">
                <FormField
                  form={form}
                  name="crisisId"
                  label="Crisis"
                  selectOptions={[
                    { label: 'All Postings', value: 'all' },
                    ...crisisOptions.map(crisis => ({
                      label: crisis.name,
                      value: String(crisis.id),
                    })),
                  ]}
                />
              </div>
            )}

            <div className="lg:col-span-2 flex items-end">
              <label className="label cursor-pointer justify-start gap-3 py-0">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  {...form.register('hideFull')}
                />
                <span className="label-text">Hide full postings</span>
              </label>
            </div>
          </>
        )}
      />

      {error && <div className="mb-4 text-sm text-base-content/70">Unable to load postings.</div>}

      {loading
        ? (
            <div className="flex justify-center py-10">
              <Loading size="lg" />
            </div>
          )
        : (postings.length === 0 && !organizations.length)
            ? (
                <EmptyState
                  Icon={icon}
                  title={activeEntity === 'organizations' ? 'No organizations found' : 'No postings found'}
                  description={activeEntity === 'organizations' ? 'No organizations found yet.' : emptyMessage}
                />
              )
            : (
                <>
                  {postings.length > 0 && (
                    <PostingCollection
                      postings={postings}
                      showCrisis
                      cardsContainerClassName="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3"
                      listContainerClassName="space-y-4"
                    />
                  )}

                  {enableOrganizationSearch && organizations.length > 0 && (
                    <div className="mt-8">
                      <h2 className="text-xl font-bold mb-3">Organizations</h2>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {organizations.map((organization) => {
                          const logoUrl = organization.logo_path
                            ? `${SERVER_BASE_URL}/organization/${organization.id}/logo`
                            : null;

                          return (
                            <Card key={organization.id}>
                              <div className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                  <Link to={`/organization/${organization.id}`} className="shrink-0">
                                    <div className="avatar avatar-placeholder">
                                      {logoUrl
                                        ? (
                                            <div className="w-12 h-12 rounded-full overflow-hidden ring-1 ring-base-300 bg-base-100 flex items-center justify-center">
                                              <img
                                                src={logoUrl}
                                                alt={`${organization.name} logo`}
                                                className="h-full w-full object-contain"
                                              />
                                            </div>
                                          )
                                        : (
                                            <div className="bg-primary text-primary-content w-12 h-12 rounded-full flex items-center justify-center">
                                              {organization.name.slice(0, 2).toUpperCase()}
                                            </div>
                                          )}
                                    </div>
                                  </Link>
                                  <div className="min-w-0">
                                    <h3 className="text-lg font-semibold truncate">
                                      <Link to={`/organization/${organization.id}`} className="link link-primary link-hover hover:underline">
                                        {organization.name}
                                      </Link>
                                    </h3>
                                    <p className="text-sm text-muted truncate">
                                      {organization.location_name || 'Location not set'}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-sm text-base-content/70 line-clamp-3">
                                  {organization.description || 'No description provided.'}
                                </p>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
    </PageContainer>
  );
}

export default PostingSearchView;
