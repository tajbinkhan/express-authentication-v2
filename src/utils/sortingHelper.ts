import type { SQL } from "drizzle-orm";
import { asc, desc } from "drizzle-orm";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";

export class SortingHelper<T extends PgTableWithColumns<any>> {
	private model: T;
	private sortableFields: Record<string, SQL>;

	constructor(model: T) {
		this.model = model;
		this.sortableFields = this.getDynamicSortFields();
	}

	private getDynamicSortFields(): Record<string, SQL> {
		const fields: Record<string, SQL> = {};

		for (const [key, column] of Object.entries(this.model)) {
			if (typeof column === "object" && "name" in column) {
				fields[key] = column;
			}
		}

		return fields;
	}

	public getValidSortFields(): string[] {
		return Object.keys(this.sortableFields);
	}

	public applySorting(sortBy?: string, sortOrder?: string): SQL | undefined {
		if (!sortBy) return desc(this.model.id);

		const sortField = this.sortableFields[sortBy];

		if (!sortField) return desc(this.model.id);

		const sortDirection = sortOrder?.toLowerCase() === "asc" ? asc : desc;
		return sortDirection(sortField);
	}

	public isValidSortBy(sortBy: string): boolean {
		return sortBy in this.sortableFields;
	}

	public isValidSortDirection(sortOrder: string): boolean {
		return ["asc", "desc"].includes(sortOrder.toLowerCase());
	}
}
