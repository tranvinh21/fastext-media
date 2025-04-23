import * as BunnySDK from "@bunny.net/edgescript-sdk";
import * as BunnyStorageSDK from "@bunny.net/storage-sdk";
import { signUrl, uploadFile } from "bunny-presigned-urls";

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const sz_zone = process.env.STORAGE_ZONE!;
// biome-ignore lint/style/noNonNullAssertion: <explanation>
const access_key = process.env.STORAGE_ACCESS_KEY!;
const uploadPathname = "/upload";
const baseUrl = "https://media.fastext.vicidev.io.vn";
const expires = "1hr";
const maxSize = "10MB";
const sz = BunnyStorageSDK.zone.connect_with_accesskey(
	BunnyStorageSDK.regions.StorageRegion.Singapore,
	sz_zone,
	access_key,
);

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
			if (request.method === "POST" && url.pathname === "/sign") {
				// authorize user
				const parameters = (await request.json()) as any;
				console.log("parameters", parameters);
				// return signed url response
				return await signUrl({
					// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
					baseUrl: baseUrl + uploadPathname,
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
				console.log(request.body);
				const data = await uploadFile({
					body: request.body,
					expires,
					key: access_key,
					maxSize,
					storageZone: sz,
					url: request.url,
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
