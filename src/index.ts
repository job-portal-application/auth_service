import app from './app.js';

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Auth service is running on port ${port}`);
});