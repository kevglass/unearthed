new class {
    id = "default-fox";
    name = "Foxes";
    chatName = "Foxes";
    version = 1;
    apiVersion = 1;

    onWorldStart(game) {
        game.createMob("Michael", "fox", 128 * 10, 500, (game, mob) => {
            mob.setControls(!mob.data.movingRight, mob.data.movingRight, mob.data.jumping > 0, false);

            if (mob.state.blockedLeft || mob.state.blockedRight) {
                // we're blocked, consider whether we should try jumping for a bit
                if (mob.data.jumping > 0) {
                    mob.data.jumping++;
                    if (mob.data.jumping > 20) {
                        // give up on jumping and change direction
                        mob.data.movingRight = true;
                        mob.data.jumping = 0;
                    }
                } else {
                    // we're blocking and we've not tried jumping yet - start trying jumping
                    mob.data.jumping = 1;
                }
            } else {
                // we're no longer blocked stop jumping
                mob.data.jumping = 0;
            }
        });
    }
}