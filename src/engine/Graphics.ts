/**
 * Abstraction of an image that can be blitted to the the display
 */
export interface GraphicsImage {
    /**
     * Get the width of the image in pixels
     */
    getWidth(): number;

    /**
     * Get the height of the image in pixels
     */
    getHeight(): number;
}

/**
 * A graphics image implemented using HTML Image components
 */
export class HtmlGraphicsImage implements GraphicsImage {
    /** The image to be displayed */
    private image: HTMLImageElement;

    constructor(image: HTMLImageElement) {
        this.image = image;
    }

    /**
     * Get the HTML Image
     * 
     * @returns The underlying HTML image element for rendering
     */
    get(): HTMLImageElement {
        return this.image;
    }
    /**
     * Get the width of the image in pixels
     */
    getWidth(): number {
        return this.image.width;
    }

    /**
     * Get the height of the image in pixels
     */
    getHeight(): number {
        return this.image.height;
    }
}

/**
 * Abstraction of graphics gradient to be rendered to the screen
 */
export interface GraphicsGradient {
    /**
     * Add a color stop the gradient as a proportional offset
     * 
     * @param offset The offset into the gradient
     * @param color The color to apply (CSS/HTML style)
     */
    addColorStop(offset: number, color: string): void;
}

/**
 * Tagging interface for anything that can be used to render back 
 * to the canvas 
 */
export interface OffscreenGraphicsImage {
    /**
     * Get the abstract "thing" that will be the context
     * for rendering in this particular implementation type.
     * (e.g. canvas in HTML)
     */
    getAsImage(): any;
}

/**
 * Abstraction of graphics rendering
 */
export interface Graphics {
    /**
     * Save the current state so it can be restored later. push/pop style
     */
    save(): void;

    /**
     * Restore the previously saved state. push/pop style.
     */
    restore(): void;

    /**
     * Set the color used to fill the next operations
     * 
     * @param rgba The color to use to fill (CSS/HTML style)
     */
    setFillStyle(rgba: string): void;

    /**
     * Fill a rectangle on the screen
     * 
     * @param x The x coordinate of the top left of the rectangle
     * @param y The y coordinate of the top left of the rectangle
     * @param width The width of the rectangle
     * @param height The height of the rectangle
     */
    fillRect(x: number, y: number, width: number, height: number): void;

    /**
     * Translate the drawing position 
     * 
     * @param x The amount to translate on the x axis
     * @param y The amount to translate on the y axis
     */
    translate(x: number, y: number): void;

    /**
     * Draw an image scaled to the graphics context
     * 
     * @param img The image to draw
     * @param x The x coordinate to draw the image at
     * @param y The y coordinate to draw the image at
     * @param width The width to draw the image 
     * @param height The height to draw the image
     */
    drawScaledImage(img: GraphicsImage, x: number, y: number, width: number, height: number): void;

    /**
     * Draw an image to the graphics context
     * 
     * @param img The image to draw
     * @param x The x coordinate to draw the image at
     * @param y The y coordinate to draw the image at
     */
    drawImage(img: GraphicsImage, x: number, y: number): void;

    /**
     * Draw an image to the graphics context
     * 
     * @param img The image to draw
     * @param x The x coordinate to draw the image at
     * @param y The y coordinate to draw the image at
     */
    drawCanvasImage(canvas: OffscreenGraphicsImage, x: number, y: number): void;

    /**
     * Set the alpha value to be used in subsequent operations
     * 
     * @param alpha The alpha value to use
     */
    setGlobalAlpha(alpha: number): void;

    /**
     * Set the font to be used when rendering text
     * 
     * @param font The font definition (in CSS format)
     */
    setFont(font: string): void;

    /**
     * Fill text onto the screen
     * 
     * @param text The text to draw
     * @param x The x coordinate to draw the image at
     * @param y The y coordinate to draw the image at
     */
    fillText(text: string, x: number, y: number): void ;

    /**
     * Set the alignment when drawing text
     * 
     * @param align The alignment of the text 
     */
    setTextAlign(align: CanvasTextAlign): void ;

    /**
     * Rotate the drawing context by a given angle
     * 
     * @param ang The angle to rotate by in radians
     */
    rotate(ang: number): void;

    /**
     * Scale the drawing context by a given angle
     * 
     * @param x The amount to scale x axis by
     * @param y The amount to scale y axis by
     */
    scale(x: number, y: number): void;

    /**
     * Clear a rectangle on the screen (that is clear the color and the alpha)
     * 
     * @param x The x coordinate of the top left of the rectangle
     * @param y The y coordinate of the top left of the rectangle
     * @param width The width of the rectangle
     * @param height The height of the rectangle
     */
    clearRect(x: number, y: number, width: number, height: number): void;

    /**
     * Set the blending operation 
     * 
     * @param mode The blending mode
     */
    setCompositeOperation(mode: GlobalCompositeOperation): void;

    /**
     * Createa radial gradient to be used as a fill
     * 
     * @param x0 The x coordinate of the centre of the start circle
     * @param y0 The y coordinate of the centre of the start circle
     * @param r0 The radius of the start circle
     * @param x1 The x coordinate of the centre of the end circle
     * @param y1 The y coordinate of the centre of the end circle
     * @param r1 The radius of the end circle
     */
    createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): GraphicsGradient;

    /**
     * Fill the shape thats been described
     */
    fill(): void;

    /**
     * Add a arc to the shape being described 
     * 
     * @param x The x coordinate of the centre of the arc
     * @param y The y coordinate of the centre of the arc
     * @param radius The radius of the arc to draw
     * @param startAngle The angle to start the arc at
     * @param endAngle  The angle to end the arc at
     */
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;

    /**
     * Start describing a shape to be drawn
     */
    beginPath(): void;

    /**
     * Set a fill based on a pre-created gradient
     * 
     * @param gradient The gradient to apply
     */
    setGradientFillStyle(gradient: GraphicsGradient): void;
}

/**
 * A graphics context implements using HTML Canvas/Context 2D
 */
export class HtmlGraphics implements Graphics, OffscreenGraphicsImage {
    /** The canvas being rendered to */
    canvas: HTMLCanvasElement;
    /** The graphics context from the canvas */
    g: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.g = this.canvas.getContext("2d")!;
    }

    /**
     * Get the abstract "thing" that will be the context
     * for rendering in this particular implementation type.
     * (e.g. canvas in HTML)
     */
    getAsImage(): any {
        return this.canvas;
    }

    /**
     * Save the current state so it can be restored later. push/pop style
     */
    save(): void {
        this.g.save();
    }

    /**
     * Restore the previously saved state. push/pop style.
     */
    restore(): void {
        this.g.restore();
    }

    /**
     * Set the color used to fill the next operations
     * 
     * @param rgba The color to use to fill (CSS/HTML style)
     */
    setFillStyle(rgba: string) {
        this.g.fillStyle = rgba;
    }

    /**
     * Fill a rectangle on the screen
     * 
     * @param x The x coordinate of the top left of the rectangle
     * @param y The y coordinate of the top left of the rectangle
     * @param width The width of the rectangle
     * @param height The height of the rectangle
     */
    fillRect(x: number, y: number, width: number, height: number): void {
        this.g.fillRect(x, y, width, height);
    }

    /**
     * Translate the drawing position 
     * 
     * @param x The amount to translate on the x axis
     * @param y The amount to translate on the y axis
     */
    translate(x: number, y: number) {
        this.g.translate(x, y);
    }

    /**
     * Draw an image scaled to the graphics context
     * 
     * @param img The image to draw
     * @param x The x coordinate to draw the image at
     * @param y The y coordinate to draw the image at
     * @param width The width to draw the image 
     * @param height The height to draw the image
     */
    drawScaledImage(img: GraphicsImage, x: number, y: number, width: number, height: number) {
        this.g.drawImage((img as HtmlGraphicsImage).get(), x, y, width, height);
    }

    /**
     * Draw an image to the graphics context
     * 
     * @param img The image to draw
     * @param x The x coordinate to draw the image at
     * @param y The y coordinate to draw the image at
     */
    drawImage(img: GraphicsImage, x: number, y: number) {
        this.g.drawImage((img as HtmlGraphicsImage).get(), x, y);
    }

    /**
     * Draw an image to the graphics context
     * 
     * @param img The image to draw
     * @param x The x coordinate to draw the image at
     * @param y The y coordinate to draw the image at
     */
    drawCanvasImage(canvas: OffscreenGraphicsImage, x: number, y: number) {
        this.g.drawImage((canvas as HtmlGraphics).canvas, x, y);
    }

    /**
     * Set the alpha value to be used in subsequent operations
     * 
     * @param alpha The alpha value to use
     */
    setGlobalAlpha(alpha: number): void {
        this.g.globalAlpha = alpha;
    }

    /**
     * Set the font to be used when rendering text
     * 
     * @param font The font definition (in CSS format)
     */
    setFont(font: string): void {
        this.g.font = font;
    }

    /**
     * Fill text onto the screen
     * 
     * @param text The text to draw
     * @param x The x coordinate to draw the image at
     * @param y The y coordinate to draw the image at
     */
    fillText(text: string, x: number, y: number): void {
        this.g.fillText(text, x, y);
    }

    /**
     * Set the alignment when drawing text
     * 
     * @param align The alignment of the text 
     */
    setTextAlign(align: CanvasTextAlign): void {
        this.g.textAlign = align;
    }

    /**
     * Rotate the drawing context by a given angle
     * 
     * @param ang The angle to rotate by in radians
     */
    rotate(ang: number): void {
        this.g.rotate(ang);
    }

    /**
     * Scale the drawing context by a given angle
     * 
     * @param x The amount to scale x axis by
     * @param y The amount to scale y axis by
     */
    scale(x: number, y: number): void {
        this.g.scale(x,y);
    }

    /**
     * Clear a rectangle on the screen (that is clear the color and the alpha)
     * 
     * @param x The x coordinate of the top left of the rectangle
     * @param y The y coordinate of the top left of the rectangle
     * @param width The width of the rectangle
     * @param height The height of the rectangle
     */
    clearRect(x: number, y: number, width: number, height: number) {
        this.g.clearRect(x, y, width, height);
    }

    /**
     * Set the blending operation 
     * 
     * @param mode The blending mode
     */
    setCompositeOperation(mode: GlobalCompositeOperation): void {
        this.g.globalCompositeOperation = mode;
    }

    /**
     * Createa radial gradient to be used as a fill
     * 
     * @param x0 The x coordinate of the centre of the start circle
     * @param y0 The y coordinate of the centre of the start circle
     * @param r0 The radius of the start circle
     * @param x1 The x coordinate of the centre of the end circle
     * @param y1 The y coordinate of the centre of the end circle
     * @param r1 The radius of the end circle
     */
    createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): GraphicsGradient {
       return this.g.createRadialGradient(x0, y0, r0, x1, y1, r1);
    }

    /**
     * Fill the shape thats been described
     */
    fill() {
        this.g.fill();
    }

    /**
     * Add a arc to the shape being described 
     * 
     * @param x The x coordinate of the centre of the arc
     * @param y The y coordinate of the centre of the arc
     * @param radius The radius of the arc to draw
     * @param startAngle The angle to start the arc at
     * @param endAngle  The angle to end the arc at
     */
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
        this.g.arc(x, y, radius, startAngle, endAngle);
    }

    /**
     * Start describing a shape to be drawn
     */
    beginPath() {
        this.g.beginPath();
    }

    /**
     * Set a fill based on a pre-created gradient
     * 
     * @param gradient The gradient to apply
     */
    setGradientFillStyle(gradient: GraphicsGradient): void {
        this.g.fillStyle = gradient as CanvasGradient;
    }
}