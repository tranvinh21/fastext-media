import * as BunnySDK from "@bunny.net/edgescript-sdk";
import * as BunnyStorageSDK from "@bunny.net/storage-sdk";
import { signUrl, uploadFile } from "bunny-presigned-urls";

interface BodyPayload {
	filePath: string;
	fileSizeInBytes: number;
}
// biome-ignore lint/style/noNonNullAssertion: <explanation>
const sz_zone = process.env.STORAGE_ZONE!;
// biome-ignore lint/style/noNonNullAssertion: <explanation>
const access_key = process.env.STORAGE_ACCESS_KEY!;
const uploadPathname = "/upload";
const expires = "1hr";
const maxSize = "30MB";
const sz = BunnyStorageSDK.zone.connect_with_accesskey(
	BunnyStorageSDK.regions.StorageRegion.Singapore,
	sz_zone,
	access_key,
);

console.log("Starting server...");

BunnySDK.net.http.serve(
	{ port: 3002, hostname: "127.0.0.1" },
	async (request) => {
		try {
			const url = new URL(request.url);
			console.log(request.method);
			console.log(url.pathname);
			if (request.method === "POST" && url.pathname === uploadPathname) {
				return await uploadFile({
					body: request.body,
					expires,
					key: access_key,
					maxSize,
					storageZone: sz,
					url: request.url,
				});
				// biome-ignore lint/style/noUselessElse: <explanation>
			} else {
				const parameters = (await request.json()) as BodyPayload;
				const data = await signUrl({
					// biome-ignore lint/style/useTemplate: <explanation>
					baseUrl: url.origin + "/" + uploadPathname,
					checksum: false,
					expires,
					filePath: parameters.filePath,
					fileSizeInBytes: parameters.fileSizeInBytes,
					key: access_key,
					maxSize,
					storageZone: sz,
				});
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
