export interface RecipeItem {
    type: string;
    count: number;
}

/**
 * Description of a recipe that takes a set of input items and produces
 * a new output item
 */
export interface Recipe {
    inputs: RecipeItem[];
    worldBlock?: number;
    output: RecipeItem;
}