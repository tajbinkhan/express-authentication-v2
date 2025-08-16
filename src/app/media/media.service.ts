import { type UploadApiErrorResponse, type UploadApiResponse, v2 as cloudinary } from "cloudinary";
import { desc, eq, inArray } from "drizzle-orm";
import { StatusCodes } from "http-status-codes";

import DrizzleService from "@/databases/drizzle/service";
import type { MediaSchemaType } from "@/databases/drizzle/types";
import { media } from "@/models/drizzle/media.model";
import { type ServiceApiResponse, ServiceResponse } from "@/utils/serviceApi";

interface Files {
	file: File;
	alt: string;
}

interface UploadApiResponseWithAlt extends UploadApiResponse {
	alt: string;
}

interface OmittedMediaSchemaType extends Omit<MediaSchemaType, "id" | "createdAt" | "updatedAt"> {}

export default class MediaService extends DrizzleService {
	constructor() {
		super();
		cloudinary.config({
			cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
			api_key: process.env.CLOUDINARY_API_KEY,
			api_secret: process.env.CLOUDINARY_API_SECRET
		});
	}

	private managedData(data: UploadApiResponseWithAlt): OmittedMediaSchemaType {
		return {
			src: data.secure_url,
			alt: data.alt,
			mimeType: data.resource_type,
			size: data.bytes,
			additionalData: {
				public_id: data.public_id,
				format: data.format,
				secure_url: data.secure_url,
				resource_type: data.resource_type
			}
		};
	}

	private async saveToDatabase(
		data: OmittedMediaSchemaType | OmittedMediaSchemaType[]
	): Promise<MediaSchemaType[]> {
		try {
			if (Array.isArray(data)) {
				const saveData = await this.getDb().insert(media).values(data).returning();

				return Promise.resolve(saveData);
			} else {
				const saveData = await this.getDb().insert(media).values(data).returning();

				return Promise.resolve(saveData);
			}
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	async uploadSingleFile(
		folderName: string,
		imageUpload: Files
	): Promise<UploadApiResponseWithAlt> {
		const arrayBuffer = await imageUpload.file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		return new Promise((resolve, reject) => {
			cloudinary.uploader
				.upload_stream(
					{
						resource_type: "auto",
						folder: folderName
					},
					(error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
						if (error) {
							return reject(error);
						}
						if (result) {
							const resultWithAlt = {
								...result,
								alt: imageUpload.alt
							};
							return resolve(resultWithAlt);
						} else {
							return reject(new Error("Upload failed: No result returned"));
						}
					}
				)
				.end(buffer);
		});
	}

	async deleteUploadedFile(public_id: string) {
		return new Promise(async (resolve, reject) => {
			try {
				const result = await cloudinary.uploader.destroy(public_id);

				return resolve(result);
			} catch (error: any) {
				reject(new Error(error.message));
			}
		});
	}

	async deleteUploadedFiles(public_ids: string[]) {
		return Promise.all(public_ids.map(public_id => this.deleteUploadedFile(public_id)));
	}

	async retrieve(): Promise<ServiceApiResponse<MediaSchemaType[]>> {
		try {
			const data = await this.db.query.media.findMany({
				orderBy: desc(media.createdAt)
			});

			return ServiceResponse.createResponse(StatusCodes.OK, "Media retrieved successfully", data);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	async uploadFile(folderName: string, imageUploads: Files[]): Promise<OmittedMediaSchemaType[]> {
		const uploadPromises = imageUploads.map(async file => {
			const response = await this.uploadSingleFile(folderName, file);
			return this.managedData(response);
		});
		return Promise.all(uploadPromises);
	}

	async uploadFiles(files: Files[]): Promise<ServiceApiResponse<MediaSchemaType[]>> {
		try {
			const uploadedFile = await this.uploadFile("Media Library", files);

			const result = await this.saveToDatabase(uploadedFile);

			return ServiceResponse.createResponse(StatusCodes.OK, "File uploaded successfully", result);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	async updateFileName(id: number, newName: string): Promise<ServiceApiResponse<MediaSchemaType>> {
		try {
			const updatedData = await this.getDb()
				.update(media)
				.set({ alt: newName })
				.where(eq(media.id, id))
				.returning()
				.then(data => data[0]);

			return ServiceResponse.createResponse(
				StatusCodes.OK,
				"File name updated successfully",
				updatedData
			);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	async deleteFile(id: number): Promise<ServiceApiResponse<MediaSchemaType>> {
		try {
			const deletedData = await this.getDb()
				.delete(media)
				.where(eq(media.id, id))
				.returning()
				.then(data => data[0]);

			this.deleteUploadedFile((deletedData.additionalData as UploadApiResponse).public_id);

			return ServiceResponse.createResponse(
				StatusCodes.OK,
				"File deleted successfully",
				deletedData
			);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	async deleteFileByUrl(url: string): Promise<ServiceApiResponse<MediaSchemaType[]>> {
		try {
			const data = await this.getDb().delete(media).where(eq(media.src, url)).returning();

			if (data.length === 0) {
				return ServiceResponse.createRejectResponse(StatusCodes.NOT_FOUND, "File not found");
			}

			await this.deleteUploadedFile((data[0].additionalData as UploadApiResponse).public_id);

			return ServiceResponse.createResponse(StatusCodes.OK, "File deleted successfully", data);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	async deleteFilesByUrls(urls: string[]): Promise<ServiceApiResponse<MediaSchemaType[]>> {
		try {
			const data = await this.getDb().delete(media).where(inArray(media.src, urls)).returning();

			if (data.length === 0) {
				return ServiceResponse.createRejectResponse(StatusCodes.NOT_FOUND, "Files not found");
			}

			await Promise.all(
				data.map(file =>
					this.deleteUploadedFile((file.additionalData as UploadApiResponse).public_id)
				)
			);

			return ServiceResponse.createResponse(StatusCodes.OK, "Files deleted successfully", data);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}
}
