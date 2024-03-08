const express = require("express");
const indexRouter = require("./routes/index");

const app = express();

app.use(express.json());

app.use(indexRouter);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`server is running in port ${port}`);
});
