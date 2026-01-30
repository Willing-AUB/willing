import express from 'express';

const app = express();

app.get("/", (req, res) => {
    res.json({
        hello: true
    });
});

app.listen(9090, () => {
    console.log("Listening on port 9090");
});
