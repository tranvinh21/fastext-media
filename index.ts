import * as BunnySDK from "@bunny.net/edgescript-sdk";
import * as BunnyStorageSDK from "@bunny.net/storage-sdk";
import { signUrl, uploadFile } from "bunny-presigned-urls";

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const sz_zone = process.env.STORAGE_ZONE!;
// biome-ignore lint/style/noNonNullAssertion: <explanation>
const access_key = process.env.STORAGE_ACCESS_KEY!;
const uploadPathname = "/upload";
// const baseUrl = "https://media.fastext.vicidev.io.vn";
// const baseUrl = "http://127.0.0.1:3002";
const expires = "1hr";
const maxSize = "10MB";
const sz = {
	name: process.env.STORAGE_ZONE_NAME,
	password: process.env.STORAGE_ZONE_PASSWORD,
	storageHostname: process.env.STORAGE_ZONE_STORAGE_HOSTNAME,
};

console.log("Starting server...");

BunnySDK.net.http.serve(
	{ port: 3002, hostname: "0.0.0.0" },
	async (request) => {
		try {
			const requestUrl = request.url;
			console.log(requestUrl);
			const url = new URL(requestUrl);
			console.log(url);
			console.log(request.method);
			console.log(url.pathname);
			if (request.method === "GET" && url.pathname === "/ui") {
				try {
					const fs = require("node:fs/promises");
					const path = require("node:path");

					// Path to the HTML file - adjust this to your file location
					const htmlFilePath = path.join(process.cwd(), "index.html");

					// Read the HTML file
					const htmlContent = await fs.readFile(htmlFilePath, "utf-8");

					// Return the HTML content
					return new Response(htmlContent, {
						status: 200,
						headers: {
							"Content-Type": "text/html",
						},
					});
				} catch (fileError) {
					console.error("Error reading HTML file:", fileError);
					return new Response("Error reading UI file", { status: 500 });
				}
			}
			if (request.method === "POST" && url.pathname === "/sign") {
				// authorize user
				const parameters = (await request.json()) as any;
				// return signed url response
				return await signUrl({
					// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
					baseUrl: url.origin + uploadPathname,
					checksum: false,
					expires,
					filePath: parameters.filePath,
					fileSizeInBytes: parameters.fileSizeInBytes,
					key: access_key,
					maxSize,
					storageZone: sz,
				});
			}
			if (request.method === "POST" && url.pathname === uploadPathname) {
				const requestUrl = request.url;
				const data = await uploadFile({
					body: request.body,
					expires,
					key: access_key,
					maxSize,
					storageZone: sz,
					url: requestUrl,
				});
				console.log("daa", data);
				return data;
			}
		} catch (error) {
			console.log(error);
			// hide 500 errors for security
			return new Response(undefined, {
				status: 500,
				statusText: "Internal Server Error",
			});
		}
	},
);
