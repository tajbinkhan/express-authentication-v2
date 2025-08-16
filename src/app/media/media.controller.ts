import type { Request, Response } from "express";

import MediaService from "@/app/media/media.service";

import { ApiController } from "@/core/controller";

export default class MediaController extends ApiController {
	protected mediaService: MediaService;

	constructor(request: Request, response: Response) {
		super(request, response);
		this.mediaService = new MediaService();
	}

	async index(): Promise<Response> {
		const response = await this.mediaService.retrieve();
		return this.apiResponse.sendResponse(response);
	}

	async upload(): Promise<Response> {
		const files = this.request.files as Express.Multer.File[];

		if (!files || files.length === 0) {
			return this.apiResponse.badResponse("No files uploaded");
		}

		// Convert Multer files to the expected `Files[]` format
		const processedFiles = files.map(file => ({
			file: new File([file.buffer], file.originalname, { type: file.mimetype }),
			alt: file.originalname
		}));

		// Upload to Cloudinary and store metadata
		const uploadResult = await this.mediaService.uploadFiles(processedFiles);

		// Map the result for frontend success/error matching
		const responseData =
			uploadResult.data?.map(result => ({
				src: result.src,
				alt: result.alt,
				success: true
			})) || [];

		// Build formatted response
		const formattedData = uploadResult.data.map(item => {
			const ext = item.mimeType;
			const name = item.alt.replace(/\.[^/.]+$/, ""); // remove extension
			return {
				fileName: name,
				success: true,
				fileData: {
					name,
					size: item.size,
					type: ext
				}
			};
		});

		return this.apiResponse.successResponse(
			`${responseData.length} file${responseData.length !== 1 ? "s" : ""} uploaded successfully`,
			formattedData
		);
	}

	async updateName(): Promise<Response> {
		const { params, body } = this.request;

		if (!body.name) {
			return this.apiResponse.badResponse("Name is required for updating media");
		}

		const response = await this.mediaService.updateFileName(Number(params.id), body.name);

		return this.apiResponse.sendResponse(response);
	}

	async delete(): Promise<Response> {
		const { params } = this.request;

		const response = await this.mediaService.deleteFile(Number(params.id));

		return this.apiResponse.sendResponse(response);
	}
}
