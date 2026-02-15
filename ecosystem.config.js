module.exports = {
    apps: [
        {
            name: "backend",
            script: "server.js",
            env: {
                DB_HOST: "localhost",
                DB_USER: "root",
                DB_PASSWORD: "",
                DB_NAME: "school_db",
                JWT_SECRET: "your_secret_here"
            }
        }
    ]
};
