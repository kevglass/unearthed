/**
 * Abstraction of an image that can be blitted to the the display
 */
export class GraphicsImage {
    /** The image to be displayed */
    private image: HTMLImageElement;
    /** So we don't need a global variable for each image. */
    name: string;
    /** Where in the big PNG this image is. Only used by webGL. Inheritence is confusing. */
    texX: number;
    texY: number;

    constructor(name:string, image: HTMLImageElement) {
        this.name = name;
        this.image = image;
		this.texX = 0;
		this.texY = 0;
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

export enum GraphicsType {
    CANVAS = "Canvas",
    WEBGL = "WebGL",
}
/**
 * Abstraction of graphics rendering
 */
export interface Graphics {
    /**
     * Get the type of graphics renderer being used
     */
    getType(): GraphicsType;

    /**
     * Save the current state so it can be restored later. push/pop style
     */
    save(): void;

    /**
     * Restore the previously saved state. push/pop style.
     */
    restore(): void;
	
    /**
     * Renders everything to the screen. If using webgl or a backbuffer.
     */
    render(): void;

    /**
     * True if all images are loaded and everything is set up.
     */
    isReady(): boolean;
	
	/**
	 * Call this after all the images are done loading.
	 */
	doneLoadingImages(images: Record<string, GraphicsImage>): void;
	
    clearScreen(r:number, g:number, b:number): void;
	
    /**
     * Set the color used to fill the next operations
     * @param r is 0-255
     * @param g is 0-255
     * @param b is 0-255
     * @param a is 0-1
     */
    setFillColor(r:number, g:number, b:number, a:number): void;
	
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

    getType(): GraphicsType {
        return GraphicsType.CANVAS;
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

    isReady(): boolean {
		return true
    }
	
	doneLoadingImages(images: Record<string, GraphicsImage>): void {
	}
	
    render(): void {
    }
	
    clearScreen(r: number, g: number, b: number) {
		this.setFillColor(r, g, b, 1)
		this.fillRect(0, 0, this.canvas.width, this.canvas.height)
	}
	
    /**
     * Set the color used to fill the next operations
     * @param r is 0-255
     * @param g is 0-255
     * @param b is 0-255
     * @param a is 0-1
     */
    setFillColor(r:number, g:number, b:number, a:number) {
        this.g.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
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
        this.g.drawImage(img.get(), x, y, width, height);
    }

    /**
     * Draw an image to the graphics context
     * 
     * @param img The image to draw
     * @param x The x coordinate to draw the image at
     * @param y The y coordinate to draw the image at
     */
    drawImage(img: GraphicsImage, x: number, y: number) {
        this.g.drawImage(img.get(), x, y);
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

/**
 * A graphics context implements using HTML Canvas/Context 2D
 */
export class WebglGraphics implements Graphics, OffscreenGraphicsImage {
    /** The canvas being rendered to */
    private canvas: HTMLCanvasElement;
    /** The graphics context from the canvas */
    private gl: WebGLRenderingContext;
    /** Store data for all draws, to send to webgl. */
	private positions: Int16Array;
	private rotations: Float32Array;
	private rgbas: Uint32Array;
    /** Size in pixels of the large PNG containing all the graphics. */
	private texWidth: number = 0;
	private texHeight: number = 0;
    /** Max calls to drawImage per frame. Can be any number. Size of our array. */
	private maxDraws: number = 10000;
    /** Total images drawn so far this frame. */
	private draws: number = 0;
    /** Extension for speedup. */
	private extension: ANGLE_instanced_arrays;
    /** The shaders. */
	private shaderProgram: WebGLProgram;
    /** Stack of saved states for transforms. */
	private states: any[] = [];
    /** The current transforms on this saved state. */
	private transforms: any[] = [];
    /** The current color for rectangles/text. */
	private rgba: number = 0xFFFFFF7F;
    /** The alpha for everything. Pass in 0-1 but it's 0-128 instead of 0-255 because I'm saving 2 bytes to show superbright images if you go over. */
	private alpha: number = 128;
    /** The current transform values. */
	private translateX: number = 0;
	private translateY: number = 0;
	private scaleX: number = 1;
	private scaleY: number = 1;
	private rotation: number = 0;
    /** The current text drawing values. */
	private fontSize: number = 16;
	private textAlign: CanvasTextAlign = 'left';
	
    getType(): GraphicsType {
        return GraphicsType.WEBGL;
    }

    isReady(): boolean {
		return (this.texWidth > 0);
    }
	
	/**
	 * Call this every frame to actually draw everything onto the canvas.
	 * Renders all drawImage calls that happened since the last time you called render()
	 */
	render() {
		var gl = this.gl;
		
		// Only send to gl the amount slots in our arrayBuffer that we used this frame.
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.rgbas.subarray(0, this.draws * 6));
		
		// Draw everything. 6 is because 2 triangles make a rectangle.
		this.extension.drawElementsInstancedANGLE(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0, this.draws);
		
		// Go back to index 0 of our arrayBuffer, since we overwrite its slots every frame.
		this.draws = 0;
	}
	
	/**
	 * Call this after all the images are done loading.
	 */
	doneLoadingImages(images: Record<string, GraphicsImage>): void {
		// Sort images by tallest. For my cheap texture packing algo.
		let list = [];
		for(var name in images) {
			let image = images[name];
			list.push(image);
		}
		list.sort((a,b) => a.getHeight() > b.getHeight() ? -1: 1);
		
		// Assume everything fits in a 2048x2048 image.
		var canvas = document.createElement('canvas')
		canvas.width = canvas.height = 2048
		
		// Top left pixel is white so fillRect can stretch and tint that pixel to any color and size.
		var pen = canvas.getContext('2d') as CanvasRenderingContext2D;
		pen.fillStyle = '#FFF';
		pen.fillRect(0, 0, 1, 1);
		
		// Pack all images into 1 texture.
		var x = 2, y = 0, rowHeight = 0;
		for(var image of list) {
			if(x + image.getWidth() > canvas.width) {
				x = 0;
				y += rowHeight;
				rowHeight = 0;
			}
			if(!rowHeight) {
				rowHeight = image.getHeight();
			}
			image.texX = x;
			image.texY = y;
			pen.drawImage(image.get(), x, y);
			x += image.getWidth();
		}
		
		this.loadTexFromCanvas(canvas);
		
		window.addEventListener("resize", () => setTimeout(() => this.resize(), 40))
	}

	/**
	 * Sets the game's texture. Can be called mid-game to change all the artwork.
	 */
	loadTexFromCanvas(canvas: HTMLCanvasElement) {
		var gl = this.gl;
		
		// Create a gl texture from image file.
		gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.activeTexture(gl.TEXTURE0);
		
		// Tell gl that when draw images scaled up, keep it pixellated and don't smooth it.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		
		// Store texture size in vertex shader.
		this.texWidth = canvas.width;
		this.texHeight = canvas.height;
		gl.uniform2f(gl.getUniformLocation(this.shaderProgram, "uTexSize"), this.texWidth, this.texHeight);
		
		this.resize();
	}
	
	/**
	 * Keeps everything full screen. Call when browser resizes.
	 */
	resize() {
		var gl = this.gl;
		
		// Resize the gl viewport to be the new size of the canvas.
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		
		// Update the shader variables for canvas size.
		// Sending it to gl now so we don't have to do the math in JavaScript on every draw,
		// since gl wants to draw at a position from 0 to 1, and we want to do drawImage with a screen pixel position.
		gl.uniform2f(gl.getUniformLocation(this.shaderProgram, "uCanvasSize"), this.canvas.width/2, this.canvas.height/2);
	}
	
	/**
	 * Set up shaders. Can call this before loading any images.
	 */
    constructor(canvas: HTMLCanvasElement) {
		// Get the canvas/context from html.
		this.canvas = canvas
		var gl = canvas.getContext('experimental-webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true }) as WebGLRenderingContext
		this.gl = gl
		
		// This extension allows us to repeat the draw operation 6 times (to make 2 triangles) on the same 12 slots in this.positions,
		//  so we only have to put the image data into this.positions once for each image each time we want to draw an image.
		var extension = gl.getExtension('ANGLE_instanced_arrays') as ANGLE_instanced_arrays
		this.extension = extension
		
		// Vertex shader source code.
		// Each time we draw an image it will run this 6 times. Once for each point of the 2 triangles we use to make the image's rectangle area.
		// The only thing that changes on each repeated draw for the same image is aSizeMult, so we can get to each corner of the image's rectangle area.
		var vertCode = "\
			attribute vec2 aSizeMult;\
			attribute vec2 aPos;\
			attribute vec2 aSize;\
			attribute vec4 aTexPos;\
			attribute vec4 aRgba;\
			attribute float aRotation;\
			\
			varying highp vec2 fragTexturePos;\
			varying vec4 fragAbgr;\
			\
			uniform vec2 uCanvasSize;\
			uniform vec2 uTexSize;\
			\
			void main(void){\
				vec2 drawPos;\
				if(aRotation != 0.0){\
					float goX = cos(aRotation);\
					float goY = sin(aRotation);\
					vec2 cornerPos = aSize * (aSizeMult);\
					drawPos = (aPos + vec2(goX*cornerPos.x - goY*cornerPos.y, goY*cornerPos.x + goX*cornerPos.y)) / uCanvasSize;\
				} else {\
					drawPos = (aPos + aSize*aSizeMult) / uCanvasSize;\
				}\
				gl_Position = vec4(drawPos.x - 1.0, 1.0 - drawPos.y, 0.0, 1.0);\
				fragTexturePos = (aTexPos.xy + aTexPos.zw * aSizeMult) / uTexSize;\
				if(aRgba.x > 127.0) {\
					float colorMult = pow(2.0, (aRgba.x-127.0)/16.0) / 255.0;\
					fragAbgr = vec4(aRgba.w*colorMult, aRgba.z*colorMult, aRgba.y*colorMult, 1.0);\
				} else\
					fragAbgr = vec4(aRgba.w/255.0, aRgba.z/255.0, aRgba.y/255.0, aRgba.x/127.0);\
			}\
		"

		// Create a vertex shader object with code.
		var vertShader = gl.createShader(gl.VERTEX_SHADER) as WebGLShader
		gl.shaderSource(vertShader, vertCode)
		gl.compileShader(vertShader)

		// Fragment shader source code.
		var fragCode = "\
			varying highp vec2 fragTexturePos;\
			varying highp vec4 fragAbgr;\
			uniform sampler2D uSampler;\
			\
			void main(void){\
				gl_FragColor = texture2D(uSampler, fragTexturePos) * fragAbgr;\
			}\
		"
		
		// Create fragment shader object with code.
		var fragShader = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader
		gl.shaderSource(fragShader, fragCode)
		gl.compileShader(fragShader)

		// Create a shader program object and attach the shaders.
		var shaderProgram = gl.createProgram() as WebGLProgram
		gl.attachShader(shaderProgram, vertShader)
		gl.attachShader(shaderProgram, fragShader)
		gl.linkProgram(shaderProgram)
		gl.useProgram(shaderProgram)
		this.shaderProgram = shaderProgram
		
		// Tell gl that when we set the opacity, it should be semi transparent above what was already drawn.
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
		gl.enable(gl.BLEND)
		gl.disable(gl.DEPTH_TEST)
		
		// Map triangle vertexes to our multiplier array, for which corner of the image drawn's rectangle each triangle point is at.
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer())
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array([0, 1, 2, 2, 1, 3]), gl.STATIC_DRAW)

		// Our multiplier array for width/height so we can get to each corner of the image drawn.
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 0,1, 1,0, 1,1]), gl.STATIC_DRAW)

		// Size multiplier vec2 variable. This code goes here so that it's linked to the Float32Array above, using those values.
		var attribute = gl.getAttribLocation(shaderProgram, "aSizeMult")
		gl.enableVertexAttribArray(attribute)
		gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0)

		// Whenever we call our drawImage(), we put in 2 shorts into our arrayBuffer for position (drawX,drawY)
		var shortsPerImagePosition = 2
		// Whenever we call our drawImage(), we put in 2 shorts into our arrayBuffer for size (width,height)
		var shortsPerImageSize = 2
		// Whenever we call our drawImage(), we also store 4 shorts into our arrayBuffer (texX,texY,texWidth,texHeight)
		var shortsPerImageTexPos = 4
		// Whenever we call our drawImage(), we also store 4 bytes into our arrayBuffer (r,g,b,a) for color and alpha.
		var bytesPerImageRgba = 4
		// Whenever we call our drawImage(), we also put a float for rotation.
		var floatsPerImageRotation = 1
		
		// Total bytes stored into arrayBuffer per image = 24
		var bytesPerImage = shortsPerImagePosition * 2 + shortsPerImageSize * 2 + shortsPerImageTexPos * 2 + bytesPerImageRgba + floatsPerImageRotation * 4
		
		// Make a buffer big enough to have all the data for the max images we can show at the same time.
		var arrayBuffer = new ArrayBuffer(this.maxDraws * bytesPerImage)
		
		// Make 3 views on the same arrayBuffer, because we store 3 data types into this same byte array.
		// When we store image positions/UVs into our arrayBuffer we store them as shorts (int16's)
		this.positions = new Int16Array(arrayBuffer)
		// When we store image rotation into our arrayBuffer we store it as float, because it's radians.
		this.rotations = new Float32Array(arrayBuffer)
		// When we store image rgbas into our arrayBuffer we store it as 1 4-byte int32.
		this.rgbas = new Uint32Array(arrayBuffer)
		
		// Make the gl vertex buffer and link it to our arrayBuffer. Using DYNAMIC_DRAW because these change as images move around the screen.
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
		gl.bufferData(gl.ARRAY_BUFFER, arrayBuffer, gl.DYNAMIC_DRAW)
		
		var byteOffset = 0
		
		// Tell gl where read from our arrayBuffer to set our shader attibute variables each time an image is drawn.
		var setupAttribute = function(name: string, dataType: number, amount: number)
		{
			if(shaderProgram) {
				var attribute = gl.getAttribLocation(shaderProgram, name)
				if(attribute) {
					gl.enableVertexAttribArray(attribute)
					gl.vertexAttribPointer(attribute, amount, dataType, false, bytesPerImage, byteOffset)
					extension.vertexAttribDivisorANGLE(attribute, 1)
					if(dataType == gl.SHORT)
						amount *= 2
					if(dataType == gl.FLOAT)
						amount *= 4
					byteOffset += amount
				}
			}
		}
		
		// Tell gl that each time an image is drawn, have it read 2 array slots from our arrayBuffer as short, and store them in the vec2 I made "aPos"
		setupAttribute("aPos", gl.SHORT, shortsPerImagePosition)
		
		// Then read the next 2 array slots and store them in my vec2 "aSize"
		setupAttribute("aSize", gl.SHORT, shortsPerImageSize)
		
		// Then read the next 4 array slots and store them in my vec4 "aTexPos"
		setupAttribute("aTexPos", gl.SHORT, shortsPerImageTexPos)
		
		// Then read the next 4 bytes and store them in my vec4 "aRgba"
		setupAttribute("aRgba", gl.UNSIGNED_BYTE, bytesPerImageRgba)
		
		// Then read the next 4 bytes as 1 float and store it in my float "aRotation"
		setupAttribute("aRotation", gl.FLOAT, floatsPerImageRotation)
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
		this.transforms = [];
		this.states.push(this.transforms);
		if(this.states.length > 99)console.error("save() without restore()!");
    }

    /**
     * Restore the previously saved state. push/pop style.
     */
    restore(): void {
		// Remove last state.
		this.states.pop();
		this.transforms = this.states[this.states.length-1];
		
		// Reset.
		this.translateX = this.translateY = this.rotation = 0;
		this.scaleX = this.scaleY = 1;
		
		// Reapply all transforms.
		for(var transforms of this.states) {
			for(var transform of transforms) {
				var name = transform[0];
				if(name == 'translate') {
					this._translate(transform[1], transform[2]);
				} else if(name == 'scale') {
					this.scaleX *= transform[1];
					this.scaleY *= transform[2];
				} else if(name == 'rotate') {
					this.rotation += transform[1];
				}
			}
		}
    }

    clearScreen(r: number, g: number, b: number) {
		this.gl.clearColor(r / 255, g / 255, b / 255, 1);
		
		// Clear the canvas.
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	}
	
    /**
     * Set the color used to fill the next operations
     * @param r is 0-255
     * @param g is 0-255
     * @param b is 0-255
     * @param a is 0-1
     */
    setFillColor(r:number, g:number, b:number, a:number) {
        this.rgba = (r * 16777216) + (g << 16) + (b << 8) + Math.floor(a * 128);
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
		var rgba = this.rgba
		if(this.alpha != 128) {
			// Multiply this.rgba alhpa with globalAlpha.
			rgba = Math.floor(rgba / 255) * 255 + Math.floor((rgba % 255) * this.alpha / 128)
		}
		this._drawImage(0, 0, 1, 1, x, y, width, height, rgba)
    }

    /**
     * Draws a this rectangular portion of the big png.
     */
	private _drawImage(texX: number, texY: number, texWidth: number, texHeight: number, drawX: number, drawY: number, width: number, height: number, rgba: number)
	{
		var i = this.draws * 6
		
		// Store rgba after position/texture. Default to white and fully opaque.
		this.rgbas[i+4] = rgba || 0xFFFFFF7F
		
		// Store how rotated we want this image to be.
		this.rotations[i+5] = this.rotation
		
		// Use a local variable so it's faster to access.
		var positions = this.positions
		
		// Positions array is 2-byte shorts not 4-byte floats so there's twice as many slots.
		i *= 2
		
		// Global rotation. TODO: move this math into the shader for speedup.
		if(this.rotation) {
			var dist = Math.sqrt(drawX*drawX + drawY*drawY)
			var angle = Math.atan2(drawY, drawX)
			drawX = Math.cos(angle + this.rotation) * dist
			drawY = Math.sin(angle + this.rotation) * dist
		}
		
		// Store where we want to draw the image.
		positions[i  ] = drawX * this.scaleX + this.translateX
		positions[i+1] = drawY * this.scaleY + this.translateY
		positions[i+2] = width * this.scaleX
		positions[i+3] = height * this.scaleY
		
		// Store what portion of our PNG we want to draw.
		positions[i+4] = texX
		positions[i+5] = texY
		positions[i+6] = texWidth
		positions[i+7] = texHeight
		
		// Count how many images were drawn this frame so we only send that many array slots to webgl.
		this.draws++
	}
	
    /**
     * Translate the drawing position 
     * 
     * @param x The amount to translate on the x axis
     * @param y The amount to translate on the y axis
     */
    translate(x: number, y: number) {
		this._translate(x, y)
		this.transforms.push(["translate",x,y])
    }
	_translate(x:number, y:number) {
		x *= this.scaleX;
		y *= this.scaleY;
		var angle = Math.atan2(y, x);
		var dist = Math.sqrt(x*x + y*y);
		this.translateX += Math.cos(angle + this.rotation) * dist;
		this.translateY += Math.sin(angle + this.rotation) * dist;
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
		this._drawImage(img.texX, img.texY, img.getWidth(), img.getHeight(), x, y, width, height, 0xFFFFFF00 + this.alpha);
    }

    /**
     * Draw an image to the graphics context
     * 
     * @param img The image to draw
     * @param x The x coordinate to draw the image at
     * @param y The y coordinate to draw the image at
     */
    drawImage(img: GraphicsImage, x: number, y: number) {
		this._drawImage(img.texX, img.texY, img.getWidth(), img.getHeight(), x, y, img.getWidth(), img.getHeight(), 0xFFFFFF00 + this.alpha);
    }

    /**
     * Draw an image to the graphics context
     * 
     * @param img The image to draw
     * @param x The x coordinate to draw the image at
     * @param y The y coordinate to draw the image at
     */
    drawCanvasImage(canvas: OffscreenGraphicsImage, x: number, y: number) {
    }

    /**
     * Set the alpha value to be used in subsequent operations
     * 
     * @param alpha The alpha value to use
     */
    setGlobalAlpha(alpha: number): void {
		this.alpha = Math.floor(alpha * 128);
    }

    /**
     * Set the font to be used when rendering text
     * 
     * @param font The font definition (in CSS format)
     */
    setFont(font: string): void {
		this.fontSize = parseInt(font) || 16;
    }

    /**
     * Fill text onto the screen
     * 
     * @param text The text to draw
     * @param x The x coordinate to draw the image at
     * @param y The y coordinate to draw the image at
     */
    fillText(text: string, x: number, y: number): void {
		text = text.toUpperCase();
		
		var h = this.fontSize * .55;
		var w = h / 2;
		var spacing = w * 1.2;
		var textWidth = text.length * spacing;
		if(this.textAlign == 'center') {
			x -= textWidth / 2;
		} else if(this.textAlign == 'right') {
			x -= textWidth;
		}
		y -= h;
		
		var fat = 3;
		for(var i = 0; i < text.length; i++) {
			//we don't have a bitmap font yet so just draw rectangles.
			var letter = text[i];
			'AHJMNOQUVW034789'.includes(letter) && this.fillRect(x+w-fat, y, fat, h);
			'BCDEGJLOQSUVWZ023568'.includes(letter) && this.fillRect(x, y+h-fat, w, fat);
			'ABCDEFGMNOPQRSTZ02356789'.includes(letter) && this.fillRect(x, y, w, fat);
			'IMTWY1'.includes(letter) && this.fillRect(x+w/2-1, y+fat, fat, h-fat);
			'ABEFHKPRSXYZ2345689'.includes(letter) && this.fillRect(x, y+h/2-fat, w, fat);
			'BDGKRSX56'.includes(letter) && this.fillRect(x+w-fat, y+h-3, fat, -h/2+3);
			'BDKPRXYZ2'.includes(letter) && this.fillRect(x+w-fat, y+3, fat, h/2-3);
			'ABCDEFGHKLMNOPQRUVW068SXY459'.includes(letter) && this.fillRect(x, y, fat, h/2);
			'ABCDEFGHKLMNOPQRUVW068JXZ2'.includes(letter) && this.fillRect(x, y+h, fat, -h/2);
			x += spacing;
		}
    }

    /**
     * Set the alignment when drawing text
     * 
     * @param align The alignment of the text 
     */
    setTextAlign(align: CanvasTextAlign): void {
        this.textAlign = align;
    }

    /**
     * Rotate the drawing context by a given angle
     * 
     * @param ang The angle to rotate by in radians
     */
    rotate(ang: number): void {
		this.rotation += ang;
		this.transforms.push(["rotate", ang]);
    }

    /**
     * Scale the drawing context by a given angle
     * 
     * @param x The amount to scale x axis by
     * @param y The amount to scale y axis by
     */
    scale(x: number, y: number): void {
		this.scaleX *= x;
		this.scaleY *= y;
		this.transforms.push(["scale", x, y]);
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
    }

    /**
     * Set the blending operation 
     * 
     * @param mode The blending mode
     */
    setCompositeOperation(mode: GlobalCompositeOperation): void {
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
		return 0 as unknown as GraphicsGradient;
    }

    /**
     * Fill the shape thats been described
     */
    fill() {
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
    }

    /**
     * Start describing a shape to be drawn
     */
    beginPath() {
    }

    /**
     * Set a fill based on a pre-created gradient
     * 
     * @param gradient The gradient to apply
     */
    setGradientFillStyle(gradient: GraphicsGradient): void {
    }
}

