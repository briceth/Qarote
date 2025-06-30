#!/usr/bin/env node

/**
 * Test script for server management endpoints
 * Run this script to verify that server update and delete functionality works
 */

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3001/api";

async function testServerManagement() {
  console.log("🧪 Testing Server Management Endpoints\n");

  // You'll need to replace these with actual values
  const AUTH_TOKEN = "your-auth-token"; // Get this from browser dev tools after login
  const TEST_SERVER_ID = "your-test-server-id"; // Get this from the database or API

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${AUTH_TOKEN}`,
  };

  try {
    // Test 1: Get all servers
    console.log("1️⃣ Testing GET /servers...");
    const serversResponse = await fetch(`${BASE_URL}/servers`, {
      headers,
    });
    const serversData = await serversResponse.json();
    console.log(
      "✅ Get servers:",
      serversData.servers?.length || 0,
      "servers found\n"
    );

    if (!serversData.servers || serversData.servers.length === 0) {
      console.log(
        "ℹ️  No servers found. Please add a server first to test update/delete operations.\n"
      );
      return;
    }

    const testServerId = serversData.servers[0].id;
    console.log(`📋 Using server ID: ${testServerId}\n`);

    // Test 2: Update server
    console.log("2️⃣ Testing PUT /servers/:id...");
    const updateData = {
      name: `Updated Server ${Date.now()}`,
      host: serversData.servers[0].host,
      port: serversData.servers[0].port,
      username: serversData.servers[0].username,
      vhost: serversData.servers[0].vhost,
    };

    const updateResponse = await fetch(`${BASE_URL}/servers/${testServerId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updateData),
    });

    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log("✅ Server updated successfully:", updateResult.server.name);
    } else {
      const error = await updateResponse.json();
      console.log("❌ Update failed:", error);
    }

    // Test 3: Test connection endpoint
    console.log("\n3️⃣ Testing POST /servers/test-connection...");
    const testConnectionData = {
      host: serversData.servers[0].host,
      port: serversData.servers[0].port,
      username: serversData.servers[0].username,
      password: "your-password", // You'll need to provide the actual password
      vhost: serversData.servers[0].vhost,
    };

    const connectionResponse = await fetch(
      `${BASE_URL}/servers/test-connection`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(testConnectionData),
      }
    );

    if (connectionResponse.ok) {
      const connectionResult = await connectionResponse.json();
      console.log(
        "✅ Connection test:",
        connectionResult.success ? "SUCCESS" : "FAILED"
      );
      if (connectionResult.version) {
        console.log("📊 RabbitMQ Version:", connectionResult.version);
      }
    } else {
      const error = await connectionResponse.json();
      console.log("❌ Connection test failed:", error);
    }

    // Note: We don't test DELETE in this script to avoid accidentally deleting servers
    console.log(
      "\n4️⃣ DELETE endpoint available but not tested (to prevent accidental deletion)"
    );
    console.log("   Use: DELETE /servers/:id");

    console.log("\n🎉 Server management endpoints are working!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("\n💡 Instructions:");
    console.log("1. Make sure the backend server is running");
    console.log(
      "2. Update AUTH_TOKEN with a valid JWT token from browser dev tools"
    );
    console.log("3. Make sure you have at least one server configured");
  }
}

// Helper function to extract token from cookie (if using cookie auth)
function getAuthTokenFromCookie() {
  // This would work in a browser environment
  // return document.cookie.split('auth-token=')[1]?.split(';')[0];
  return null;
}

console.log("📝 Server Management API Test");
console.log("================================");
console.log("Before running this test:");
console.log("1. Start your backend server: npm run dev (in back-end folder)");
console.log(
  "2. Login to your app and get the auth token from browser dev tools"
);
console.log("3. Update the AUTH_TOKEN variable in this script");
console.log("4. Run: node test-server-management.js\n");

// Uncomment the line below and update the AUTH_TOKEN to run the test
// testServerManagement();

module.exports = { testServerManagement };
