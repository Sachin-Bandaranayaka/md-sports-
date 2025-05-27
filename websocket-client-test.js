const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:3000"; // Assuming your Next.js app runs on port 3000
const SOCKET_PATH = "/api/socketio";
const TEST_EVENT = "dashboard:update"; // From WEBSOCKET_EVENTS.DASHBOARD_UPDATE

console.log(`Attempting to connect to WebSocket server at ${SERVER_URL} with path ${SOCKET_PATH}...`);

const socket = io(SERVER_URL, {
    path: SOCKET_PATH,
    reconnectionAttempts: 3,
    timeout: 5000,
});

socket.on("connect", () => {
    console.log(`Successfully connected to WebSocket server with ID: ${socket.id}`);
    console.log(`Listening for event: "${TEST_EVENT}"`);
    console.log("Please trigger the test event now (e.g., by visiting /api/websocket-test?event=dashboard in your browser).");
});

socket.on(TEST_EVENT, (data) => {
    console.log(`Received event "${TEST_EVENT}"!`);
    console.log("Data:", data);
    console.log("WebSocket test successful!");
    socket.disconnect();
    process.exit(0); // Success
});

socket.on("connect_error", (err) => {
    console.error("Connection Error:", err.message);
    if (err.data) {
        console.error("Error details:", err.data);
    }
    console.error("WebSocket test failed: Could not connect.");
    process.exit(1); // Failure
});

socket.on("disconnect", (reason) => {
    console.log(`Disconnected from WebSocket server. Reason: ${reason}`);
    if (reason === "io server disconnect") {
        // the server initiated the disconnection
        socket.connect();
    }
});

// Timeout for the test
setTimeout(() => {
    if (!socket.connected) {
        console.error(`Test timed out after 30 seconds. Could not connect or receive event "${TEST_EVENT}".`);
    } else {
        console.error(`Test timed out after 30 seconds. Did not receive event "${TEST_EVENT}". Make sure the event was triggered.`);
    }
    socket.disconnect();
    process.exit(1); // Failure
}, 30000);

console.log("WebSocket client test script started. Waiting for connection and event..."); 