/**
 * The definition of a function that will be called to cause any 
 * mob to think and act
 * 
 * @param game The game context to interact with the world
 * @param mob The mob doing that there thinking
 */
export type MobThinkFunction = (game: GameContext, mob: MobContext) => void;

/**
 * A representation of any mob in the game from the view of a Mod.
 */
export interface MobContext {
    /** The unique ID of the mob */
    readonly id: string;
    /** The name of the mob - displayed above their head */
    name: string;
    /** The x co-ordinate the mob's position given in world units (tiles are 128 pixels) */
    x: number;
    /** The y co-ordinate the mob's position given in world units (tiles are 128 pixels) */
    y: number;
    /** The vertical velocity of the mob */
    vy: number;
    /** The horizontal velocity of the mob */
    vx: number;
    /** The gravity to apply to this mob */
    gravity: number;
    /** True if this mob should block movement */
    blocksMovement: boolean;
    /** The state of this mod - this describes what happened last frame */
    state: MobState;
    /** Generic user data that the mod can store things per mod in */
    data: Record<string, any>;
    
    /** True if this mob is a player */
    isPlayer(): boolean;

    /**
     * Set the control state of the mob. Changing these controls will cause the 
     * mob to move, jump or use items as with any player.
     * 
     * @param left True if the mob is trying to move left
     * @param right True if the mob is trying to move right
     * @param up True if the up button is pressed (e.g. jump)
     * @param down True if the down button is pressed (e.g. down ladder)
     */
    setControls(left: boolean, right: boolean, up: boolean, down: boolean): void;
}

/**
 * A representation of the Game from the Mod's point of view. While the actual game object is exposed
 * to the mod, this interface describes the agreed contract between the mod and the game. Anything
 * outside of this might break between versions.
 */
export interface GameContext {
    /**
     * Log a message to the Javascript console in the context of this mod
     * 
     * @param message The message to be logged
     */
    log(message: string): void;

    /**
     * Log a error to the Javascript console in the context of this mod
     * 
     * @param e The error to be logged
     */
    error(e: any): void;

    /**
     * Check if the game is in creative mode
     */
    inCreativeMode(): boolean;

    /**
     * Display a chat message in game
     * 
     * @param message The message to retrieve
     */
    displayChat(message: string): void;

    /**
     * Get a resource that was uploaded along with this mod. The name 
     * will be the path in the zip.
     * 
     * @param name The name of the resource to get
     */
    getModResource(name: string): string;

    /**
     * Add an image to the internal cache. If the image already existed
     * it will be replaced. This lets you switch assets.
     * 
     * @param id The ID of the image in the cache
     * @param data The raw data as returned from @see getModResource
     */
    addImage(id: string, data: string): void;

    /**
     * Add an sound effect to the internal cache. If the sound effect  already existed
     * it will be replaced. This lets you switch assets.
     * 
     * @param id The ID of the sound effect in the cache
     * @param data The raw data as returned from @see getModResource
     */
    addAudio(id: string, data: string): void;

    /**
     * Add a block definition to the list. The Block ID is a numeric index
     * thats used in the world array. If you're doing custom ones probably
     * best to start at 100. Right now theres only 255 allowed.
     * 
     * @param blockId The ID of the block to add. If it already exists it'll be replaced.
     * @param tileDef The definition of the new block. @see Block for more details.
     */
    addBlock(blockId: number, tileDef: Block): void;

    /**
     * Remove a block from the game configuration based on its block ID. This is useful for
     * mods to change the default mod rather than turning it off altogether.
     * 
     * @param blockId The ID of the block to remove
     */
    removeBlock(blockId: number): void;

    /**
     * Equivalent to Javascript setTimeout but fired in the context of the mod
     * 
     * @param callback The callback name to call back with
     * @param timeout The timeout in game ticks
     * @param tileX The x coordinate of the optional tile location this time was associated with
     * @param tileY The y coordinate of the optional tile location this time was associated with
     * @param layer The layer of optional tile location this time was associated with
     */
    startTimer(callback: string, timeout: number, tileX?: number, tileY?: number, layer?: number): void;

    /**
     * Remove a tool from the game configuration based on its tool ID. This is useful for
     * mods to change the default mod rather than turning it off altogether.
     * 
     * @param toolId The ID of the tool to remove
     */
    removeToolByToolId(toolId: string): void;

    /**
     * Remove a tool from the game configuration based on its block it places. This is useful for
     * mods to change the default mod rather than turning it off altogether.
     * 
     * @param blockId The placement block ID of the tool to remove
     */
    removeToolByBlock(blockId: number): void;

    /**
     * Remove a tool from the game configuration based on the image it uses. This is useful for
     * mods to change the default mod rather than turning it off altogether.
     * 
     * @param image The name of the image used by the tool to be removed
     */
    removeToolByImage(image: string): void;

    /**
     * Add a tool into the default inventory of all players.
     * 
     * @param image The ID of the image in the cache to show for this tool.
     * @param place The ID of the block to place for this tool (or zero for none)
     * @param toolId An ID to assign for this tool so that callbacks can identify particular calls being used
     * @param targetEmpty True if this tool can target empty spaces 
     * @param targetFull True if this tool can target spaces with a block in
     * @param delayOnOperation Time before operation takes place on a full block
     * @param breakable True if this tool has a condition - i.e. some of it used but not a whole item
     * @param amountUsed The number of items to use up for each use of the tool (note this can be partial for items that wear out over time)
     * @return An identifier that can be used to make the tool into a found item
     */
    addTool(image: string, place: number, toolId: string | undefined, targetEmpty: boolean, targetFull: boolean, delayOnOperation?: number, breakable?: boolean, amountUsed?: number): string;

    /**
     * Set a block in the game world. 
     * 
     * @param x The x coordinate of the block to be set in tiles. 
     * @param y The y coordinate of the block to be set in tiles.
     * @param layer The layer on which the block should be set (0 = foreground, 1 = background). @see Layer
     * @param blockId The ID of the block to be placed 
     */
    setBlock(x: number, y: number, layer: Layer, blockId: number): void;

    /**
     * Get the block at a particular location
     * 
     * @param x The x coordinate of the block to be retrieved in tiles. 
     * @param y The y coordinate of the block to be retrieved in tiles.
     * @param layer The layer on which the block should be set (0 = foreground, 1 = background). @see Layer
     * @return The block ID at the given location or 0 for none.
     */
    getBlock(x: number, y: number, layer: Layer): number;

    /**
     * Replace all the blocks on the map that match the original block with the
     * new one.
     * 
     * @param originalBlock The original block to be replaced
     * @param newBlock The new block to be put into the map
     */
    replaceAllBlocks(originalBlock: number, newBlock: number): void;

    /**
     * Get a handle to the local player's mob. This is kinda weird right now since
     * mods only run on the server.
     * 
     * @return The local player to be manipulated.
     */
    getLocalPlayer(): MobContext;

    /**
     * Get a list of the mobs in the world at the moment.
     * 
     * @return The list of mobs in the world
     */
    getMobs(): MobContext[];

    /**
     * Play a sound effect 
     * 
     * @param id The ID of the sound effect in the cache
     * @param volume The volume at which to play the sound (0 = silent, 1 = loudest)
     * @param variations The variations of the sound effect to attempt to apply
     */
    playSfx(id: string, volume: number, variations?: number): void;

    /**
     * Add a set of particulars at a particular tile location
     * 
     * @param image The ID of the image in the cache to use as the particle
     * @param x The x coordinate of the tile position to add the particles at
     * @param y The y coordinate of the tile position to add the particles at
     * @param count The number of particles to add
     */
    addParticlesAtTile(image: string, x: number, y: number, count: number): void;

    /**
     * Add a set of particulars at a particular world location
     * 
     * @param image The ID of the image in the cache to use as the particle
     * @param x The x coordinate of the world position to add the particles at
     * @param y The y coordinate of the world position to add the particles at
     * @param count The number of particles to add
     */
    addParticlesAtPos(image: string, x: number, y: number, count: number): void;

    /**
     * Get the meta data blob associated with the current map
     * 
     * @return The data associated with this mod
     */
    getMetaDataBlob(): any;

    /**
     * Set the meta data blob associated with the current map for this mod. Note
     * this should be called sparingly since it'll results in the meta data
     * being transmitted to the clients (theres no real use for that yet)
     * 
     * @param blob The blob to store for this mod
     */
    setMetaDataBlob(blob: any): void;

    /**
     * Load a map from a file thats part of the mod
     * 
     * @param resource The reference to the resource (@see getModResource)
     */
    loadMap(resource: string): void;

    /**
     * Check if we're running on the host. Only some parts of the mod run 
     * on the client side.
     */
    isHost(): boolean;

    /**
     * Set a game property 
     * 
     * @param prop The name of the property to set @see GameProperty
     * @param value The value to apply to the property
     */
    setGameProperty(prop: GameProperty, value: string | number | boolean): void;

    /**
     * Get the value of a property
     * 
     * @param prop The name of the property whose value is retrieved
     * @return The value of the property 
     */
    getGameProperty(prop: GameProperty): string | number | boolean;

    /**
     * Create new item floating in the world for a play to pick up
     * 
     * @param x The x coordinate in blocks to place the item at
     * @param y The y coordinate in blocks to place the item at
     * @param count The number of the item in the stack
     * @param typeId The type of the item to create as returned from @see addTool
     * @return The type of the uniquely created item
     */
    createItem(x: number, y: number, count: number, typeId: string): string;

    /**
     * Give a mob an item 
     * 
     * @param mob The mob to give the item
     * @param count The number of the item to give
     * @param typeId The type of item to give as returned from @see addTool
     */
    giveItem(mob: MobContext, count: number, typeId: string): void;

    /**
     * Take an item from a mob
     * 
     * @param mob The mob to take the item from
     * @param count The number of the item to take
     * @param typeId The type of item to take as returned from @see addTool
     */
    takeItem(mob: MobContext, count: number, typeId: string): void;

    /**
     * Get the number of an item a mob has
     * 
     * @param mob The mob to check
     * @param typeId The type of item to count as returned from @see addTool
     * @return The number of the item the mob has
     */
    countItems(mob: MobContext, typeId: string): number;

    /**
     * Create a mob in the world
     * 
     * @param name The name to give the mod (or "" to not display a name)
     * @param skin The ID of the skin of the mob to create (@see SKINS)
     * @param x The x coordinate in the world to create the mob in world coordinates (* BLOCK_SIZE)
     * @param y The y coordinate in the world to create the mob in world coordinates (* BLOCK_SIZE)
     * @param thinkFunction The callback for the mob to think each frame
     */
    createMob(name: string, skin: string, x: number, y: number, thinkFunction?: MobThinkFunction): MobContext;

    /**
     * Remove a previously created mob
     * 
     * @param mob The mob to be removed
     */
    removeMob(mob: MobContext): void;

    /**
     * Add a skin definition from a JSON file (@see getModResource)
     * 
     * @param name The name to use for this skin
     * @param skinDef The definition of the skin in a resource file
     */
    addSkinFromFile(name: string, skinDef: string): void;

    /**
     * Add a skin definition 
     * 
     * @param name The name to use for this skin
     * @param skinDef The definition of the skin as a structure
     */
    addSkin(name: string, skinDef: SkinDefinition): void;

    /**
     * Add a recipe to the game
     * 
     * @param name The name of the recipe
     * @param recipeDef The recipe to be added
     */
    addRecipe(name: string, recipeDef: Recipe): void;

    /**
     * Remove a recipe from the game 
     * 
     * @param name The name of the recipe to be removed
     */
    removeRecipe(name: string): void;
}

/**
 * The collection of properties available to configure from the mod
 */
export enum GameProperty {
    /** The background color being used in game - must be 4 byte including alpha - default is #445253FF */
    BACKGROUND_COLOR = "BACKGROUND_COLOR",
    /** The sky fill color - must be 4 byte including alpha - default is #CFEFFCFF */
    SKY_COLOR = "SKY_COLOR",
    /** The x coordinate in tiles that players should spawn at */
    SPAWN_X = "SPAWN_X",
    /** The y coordinate in tiles that players should spawn at */
    SPAWN_Y = "SPAWN_Y",
    /** Indicates whether the recipes panel is enabled */
    RECIPES_ENABLED = "RECIPES_ENABLED",
}

/**
 * Definition of a dependency
 */
export interface ModDependency {
    /** The ID of the mod we're dependent on */
    modId: string;
    /** The minimum version of that mod required */
    minVersion: number;
    /** The maximum version of that mod allowed if any */
    maxVersion?: number;
}
/**
 * This is the interface that mods can implement to get notification of events in games. Note
 * that mods only run on the server at the current time.
 */
export interface ServerMod {
    /** The ID of the mod, used as a namespace - this is mandatory, without it a mod won't load */
    id: string;
    /** The name of the mod to be displayed in the config dialog - this is mandatory, without it a mod won't load */
    name: string;
    /** The name of the mod to be displayed when the mod produces chat messages */
    chatName: string;
    /** The version of the mod */
    version: number;
    /** API version this mod uses - not present = 0 */
    apiVersion: number;
    /** Optional dependencies on other mods */
    dependencies?: ModDependency[];
    
    /**
     * Notification when the mod has been loaded/installed. Be careful what you call here since most of the 
     * system may not be available
     * 
     * @param game The context on which the mod can callback to modify the game.
     */
    onLoaded?(game: GameContext): void;

    /**
     * Implement this function if the mod wants to be the world generator. The first mod found with this method implemented
     * will be used to regenerate the map when its reset. If no mod is found with this function then default world generation
     * is used.
     * 
     * @param game The context on which the mod can callback to modify the game.
     * @param width The width of the map being generated
     * @param height The height of the map being generated
     * @param seed The seed being used
     */
    generateWorld?(game: GameContext, width: number, height: number, seed: number): void;

    /**
     * Notification of when the game starts altogether. This is a good place to add/change assets, tools and blocks since
     * it happens first in the lifecycle.
     * 
     * @param game The context on which the mod can callback to modify the game.
     */
    onGameStart?(game: GameContext): void;

    /**
     * Notification that a new world has been generated
     * 
     * @param game The context on which the mod can callback to modify the game.
     * @param width The width of the map being generated
     * @param height The height of the map being generated
     * @param seed The seed being used
     */
    onWorldGenerated?(game: GameContext, width: number, height: number, seed: number): void;

    /**
     * Notification that the player(s) are being added to the world. This is useful to show messages and do setup that 
     * is dependent on there being a network and players (e.g. sending chat messages)
     * 
     * @param game The context on which the mod can callback to modify the game.
     */
    onWorldStart?(game: GameContext): void;

    /**
     * When implemented in a mod this will be called every frame (or tick). This can be used to do dynamic updates based
     * on time.
     * 
     * @param game The context on which the mod can callback to modify the game.
     */
    onTick?(game: GameContext): void;

    /**
     * Notification that a tile has been changed in the game. Every time any player updates the world the notification
     * will callback into the mod.
     * 
     * @param game The context on which the mod can callback to modify the game.
     * @param mob The mob making the change if any (when mod make changes they don't have a mob) @see MobContext
     * @param x The x coordinate in tiles of the change
     * @param y The y coordinate in tiles of the change
     * @param layer The layer the change is taking place on (0=foreground, 1=background)
     * @param block The block that has been placed on the map (or 0 for removal)
     * @param oldBlock The block that was in this location previously
     */
    onSetTile?(game: GameContext, mob: MobContext | undefined, x: number, y: number, layer: Layer, block: number, oldBlock: number): void;

    /**
     * Notification that a player has selected a tool
     * 
     * @param game The game in which the player existing
     * @param mob The player in the world
     * @param toolId The ID of the tool selected
     */
    onSelectTool?(game: GameContext, mob: MobContext, toolId: string): void;
    
    /**
     * Notification that a mob used a tool on a given location
     * 
     * @param game The context on which the mod can callback to modify the game.
     * @param mob The mob using the tool on the location @see MobContext
     * @param x The x coordinate in tiles of the target
     * @param y The y coordinate in tiles of the target
     * @param layer The layer being targeted (0=foreground, 1=background)
     * @param toolId The id of the tool being used (as defined when doing an @see GameContext.addTool )
     */
    onUseTool?(game: GameContext, mob: MobContext | undefined, x: number, y: number, layer: Layer, toolId: string): void;

    /**
     * Notification that a mob used a tool in is progress at a given location
     * 
     * @param game The context on which the mod can callback to modify the game.
     * @param mob The mob using the tool on the location @see MobContext
     * @param x The x coordinate in tiles of the target
     * @param y The y coordinate in tiles of the target
     * @param layer The layer being targeted (0=foreground, 1=background)
     * @param toolId The id of the tool being used (as defined when doing an @see GameContext.addTool )
     */
    onProgressTool?(game: GameContext, mob: MobContext | undefined, x: number, y: number, layer: Layer, toolId: string): void;

    /**
     * Notification that a mob pressed the trigger button on a particular location.
     * 
     * @param game The context on which the mod can callback to modify the game.
     * @param mob The mob pressing the trigger on the location @see MobContext
     * @param x The x coordinate in tiles of the target
     * @param y The y coordinate in tiles of the target
     */
    onTrigger?(game: GameContext, mob: MobContext, x: number, y: number): void;

    /**
     * Notification that a mob is standing on a particular location
     * 
     * @param game The context on which the mod can callback to modify the game. 
     * @param mob The mob standing on the location @see MobContext
     * @param x The x coordinate in tiles of the location being stood on
     * @param y The y coordinate in tiles of the location being stood on
     */
    onStandOn?(game: GameContext, mob: MobContext, x: number, y: number): void;

    /**
     * Notification that a mob is blocked by a particular location
     * 
     * @param game The context on which the mod can callback to modify the game. 
     * @param mob The mob blocked by the location @see MobContext
     * @param x The x coordinate in tiles of the location blocking
     * @param y The y coordinate in tiles of the location blocking
     */
    onBlockedBy?(game: GameContext, mob: MobContext, x: number, y: number): void;

    /**
     * Notification that a mob is hitting their head on a particular location
     * 
     * @param game The context on which the mod can callback to modify the game. 
     * @param mob The mob hitting their head on the location @see MobContext
     * @param x The x coordinate in tiles of the location being hit
     * @param y The y coordinate in tiles of the location being hit
     */
    onHitHead?(game: GameContext, mob: MobContext, x: number, y: number): void;

    /**
     * Notification that a mob joined the world
     * 
     * @param game The game being joined
     * @param mob The mob that joined the game
     */
    onMobAdded?(game: GameContext, mob: MobContext): void;

    /**
     * Notification that a previously scheduled timer fired
     * 
     * @param game The game to callback on to to make changes
     * @param callbackName The name of the callback that was registered with the timer
     * @param tileX The x coordinate of the optional tile location this time was associated with
     * @param tileY The y coordinate of the optional tile location this time was associated with
     * @param layer The layer of optional tile location this time was associated with
     */
    onTimerFired?(game: GameContext, callbackName: string, tileX?: number, tileY?: number, layer?: number): void;
}

/**
 * Definition a complete skin that can be applied mods. This includes bounding box,
 * the bones that build up the character and the animation of those bones
 */
export interface SkinDefinition {
    /** The width of the bounding box */
    width: number;
    /** The height of the bounding box */
    height: number;
    /** The bones that build up the character */
    skeleton: BoneDefinition;
    /** The animation applied to those bones */
    animation: AnimDefinition;
}

/**
 * Animation of bones based on tweening between keyframes
 */
export interface AnimDefinition {
    /** The key frames to apply (keyed on bone name) to apply when in idle state */
    idle: Record<string, KeyFrame[]>;
    /** The key frames to apply (keyed on bone name) to apply when in walking state */
    walk: Record<string, KeyFrame[]>;
    /** The key frames to apply (keyed on bone name) to apply when in working state (don't have to specify this one) */
    work?: Record<string, KeyFrame[]>;
}

/**
 * The key frame for an animation. Time ranges from 0->1, the angle is the only thing we 
 * set at the moment.
 */
export interface KeyFrame {
    /** The time that the bone should be at this position (0->1) */
    time: number;
    /** The angle to apply to the bone at this state */
    angle: number;
}

/**
 * The definition of a bone and its attached image for a mob skin
 */
export interface BoneDefinition {
    /** The name of the bone to be used in key frame animation */
    name: string;
    /** The center point of the bone defined by an offset to put the image in the right place */
    centerX: number;
    /** The center point of the bone defined by an offset to put the image in the right place */
    centerY: number;
    /** The default angle to apply for this bone */
    angle: number;
    /** The offset of the sprite thats attached to this bone */
    spriteOffsetX?: number;
    /** The offset of the sprite thats attached to this bone */
    spriteOffsetY?: number;
    /** The relative layer of this bone - this lets you sprite stack. No definition, just a relative number */
    layer: number;
    /** The ID of the image from the cache to attach */
    image?: string;
    /** The children of this bone if any */
    children?: BoneDefinition[];
}

/**
 * A collection of exposed to mods to describe the state of the mod
 */
export interface MobState {
    /** True if the mod was blocked from moving left last frame */
    blockedLeft: boolean;
    /** True if the mod was blocked from moving right last frame */
    blockedRight: boolean;
    /** True if the mod was blocked from moving below last frame */
    blockedBelow: boolean;
    /** True if the mod was blocked from moving above last frame */
    blockedAbove: boolean;
}


export interface Portal {
    /** The tile index in the map */
    tileIndex: number;
    /** The code of the target server this portal links to */
    code: string | null;
}

/**
 * Definition of a block that can appear in the map
 */
export interface Block {
    /** The id of the sprite to draw for the block */
    sprite: string;
    /** True if this one blocks movement */
    blocks: boolean;
    /** True if this block act as a ladder */
    ladder: boolean;
    /** The portal information if this block is a portal */
    portal?: (portal: Portal) => void;
    /** True if this block needs ground under it to exist - like flowers - automatically destroy if nothing there */
    needsGround: boolean;
    /** True if this one blocks the discovery process - leaves for instance don't */
    blocksDiscovery: boolean;
    /** True if this block leaves a copy of itself in the background layer when removed from the foreground, used for caves discovery */
    leaveBackground: boolean;
    /** True if this would block you when you're falling downward. */
    blocksDown: boolean;
    /** True if this block prevents lights passing */
    blocksLight: boolean;
    /** The timer object with the number of ticks it takes for the block's effect to happen and the callback that defines the effect */
    timer?: { timer: number, callbackName: string };
    /** Does this block light the area */
    light?: boolean;
    /** True if we can't place this block in the background */
    backgroundDisabled?: boolean;
}

/**
 * An item used as either an input or an output to recipe
 */
export interface RecipeItem {
    /** The item type used to as a key to the tool definition */
    type: string;
    /** The number of item required or produced */
    count: number;
}

/**
 * Description of a recipe that takes a set of input items and produces
 * a new output item
 */
export interface Recipe {
    /** The ID given to the recipe - this is generated by the game */
    id?: string;
    /** The human readable name of the recipe */
    name: string;
    /** The items that are required to create this recipe's output */
    inputs: RecipeItem[];
    /** Optionally a block that the player must be standing in front of to use this recipe */
    worldBlock?: number;
    /** The item(s) created by this recipe */
    output: RecipeItem;
}

/**
 * The map layer a block is on
 */
export enum Layer {
    /** Block is in the foreground, generally blocks movement */
    FOREGROUND = 0,
    /** The Block is on the background - cave wall style */
    BACKGROUND = 1
}
