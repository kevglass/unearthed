new class {
    id = "default-Gnome";
    name = "Gnome";
    chatName = "Gnome";
    version = 1;
    apiVersion = 1;

    onWorldStart(game) {
        game.addImage("gnome_arm", game.getModResource("gnome_arm.png"));
        game.addImage("gnome_body", game.getModResource("gnome_body.png"));
        game.addImage("gnome_head", game.getModResource("gnome_head.png"));
        game.addImage("gnome_leg", game.getModResource("gnome_leg.png"));

        game.addSkinFromFile("gnome", game.getModResource("gnomeskin.json"));

        game.createMob("Gnomeo", "gnome", 128 * 10, 500, (game, mob) => {
            mob.setControls(!mob.data.movingRight, mob.data.movingRight, false, false);

            if (mob.state.blockedLeft) {
                mob.data.movingRight = true;
            } 
            if (mob.state.blockedRight) {
                mob.data.movingRight = false;
            }
        });
    };
}