import type { Request, Response } from "express";

import { ApiResponse } from "@/utils/serviceApi";

export abstract class ApiController {
	protected request: Request;
	protected response: Response;
	protected apiResponse: ApiResponse;

	protected constructor(req: Request, res: Response) {
		this.request = req;
		this.response = res;
		this.apiResponse = new ApiResponse(res);
	}
}

export interface ApiCrudController {
	index(): unknown;
	create(): unknown;
	show(id: number | string): unknown;
	update(id: number | string): unknown;
	delete(id: number | string): unknown;
}
