var w = window.innerWidth;
var h = window.innerHeight;

var config = {
    type: Phaser.WEBGL,
    width: w,
    height: h,
    backgroundColor: '#ababab',
    parent: 'phaser-example',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var buildingArr = [
    [1,0,0,0],
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,0],
]

var buildingData = [
    {
        name: null
    },
    {
        name: 'ncku-short'
    },
    {
        name: 'ncku-tall'
    },
    {
        name: 'bs'
    },
    {
        name: 'church'
    }
]

var game = new Phaser.Game(config);

var directions = {
    west: { offset: 0, x: -2, y: 0, opposite: 'east' },
    northWest: { offset: 32, x: -2, y: -1, opposite: 'southEast' },
    north: { offset: 64, x: 0, y: -2, opposite: 'south' },
    northEast: { offset: 96, x: 2, y: -1, opposite: 'southWest' },
    east: { offset: 128, x: 2, y: 0, opposite: 'west' },
    southEast: { offset: 160, x: 2, y: 1, opposite: 'northWest' },
    south: { offset: 192, x: 0, y: 2, opposite: 'north' },
    southWest: { offset: 224, x: -2, y: 1, opposite: 'northEast' }
};

var anims = {
    idle: {
        startFrame: 0,
        endFrame: 4,
        speed: 0.2
    },
    walk: {
        startFrame: 4,
        endFrame: 12,
        speed: 0.15
    },
    attack: {
        startFrame: 12,
        endFrame: 20,
        speed: 0.11
    },
    die: {
        startFrame: 20,
        endFrame: 28,
        speed: 0.2
    },
    shoot: {
        startFrame: 28,
        endFrame: 32,
        speed: 0.1
    }
};

var skeletons = [];

var tileWidthHalf;
var tileHeightHalf;

var d = 0;

var scene;
var buildingGroup;
var text;
var lastTile;

function preload ()
{
    this.load.json('map', 'assets/isometric-grass-and-water.json');
    // this.load.spritesheet('tiles', 'assets/isometric-grass-and-water.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('tiles', 'assets/tile-192.png', { frameWidth: 192, frameHeight: 192 });
    // this.load.spritesheet('tiles', 'assets/tile-384.png', { frameWidth: 384, frameHeight: 384 });
    this.load.spritesheet('skeleton', 'assets/skeleton8.png', { frameWidth: 128, frameHeight: 128 });
    // this.load.image('house', 'assets/rem_0002.png');
    this.load.image('house', 'assets/ncku.png');
    this.load.image('ncku-short', 'assets/ncku-short.png');
    this.load.image('ncku-tall', 'assets/nkcu-tall.png');
    this.load.image('bs', 'assets/bs.png');
    this.load.image('church', 'assets/church.png');
}


function create ()
{
    scene = this;
    scene.input.on('pointerdown', function(){
        text.setText('Nothing');
        if(lastTile){
            scene.tweens.add({
                targets: lastTile,
                duration: 130,
                y: '+=20',
                ease: 'Quad.easeOut',
            })
            lastTile.isJump = false;
            lastTile = null;
        }
    })

    // test text
    text = this.add.text(0,50, 'Click either of the sprites', { font: '16px Courier', fill: '#000000' }).setOrigin(0);

    //  Our Skeleton class
    var Skeleton = new Phaser.Class({
        Extends: Phaser.GameObjects.Image,
        initialize:
        function Skeleton (scene, x, y, motion, direction, distance)
        {
            this.startX = x;
            this.startY = y;
            this.distance = distance;

            this.motion = motion;
            this.anim = anims[motion];
            this.direction = directions[direction];
            this.speed = 0.15;
            this.f = this.anim.startFrame;

            Phaser.GameObjects.Image.call(this, scene, x, y, 'skeleton', this.direction.offset + this.f);

            this.depth = y + 192;

            scene.time.delayedCall(this.anim.speed * 1000, this.changeFrame, [], this);
        },
        changeFrame: function ()
        {
            this.f++;

            var delay = this.anim.speed;

            if (this.f === this.anim.endFrame)
            {
                switch (this.motion)
                {
                    case 'walk':
                        this.f = this.anim.startFrame;
                        this.frame = this.texture.get(this.direction.offset + this.f);
                        scene.time.delayedCall(delay * 1000, this.changeFrame, [], this);
                        break;

                    case 'attack':
                        delay = Math.random() * 2;
                        scene.time.delayedCall(delay * 1000, this.resetAnimation, [], this);
                        break;

                    case 'idle':
                        delay = 0.5 + Math.random();
                        scene.time.delayedCall(delay * 1000, this.resetAnimation, [], this);
                        break;

                    case 'die':
                        delay = 6 + Math.random() * 6;
                        scene.time.delayedCall(delay * 1000, this.resetAnimation, [], this);
                        break;
                }
            }
            else
            {
                this.frame = this.texture.get(this.direction.offset + this.f);

                scene.time.delayedCall(delay * 1000, this.changeFrame, [], this);
            }
        },

        resetAnimation: function ()
        {
            this.f = this.anim.startFrame;

            this.frame = this.texture.get(this.direction.offset + this.f);

            scene.time.delayedCall(this.anim.speed * 1000, this.changeFrame, [], this);
        },

        update: function ()
        {
            if (this.motion === 'walk')
            {
                this.x += this.direction.x * this.speed;

                if (this.direction.y !== 0)
                {
                    this.y += this.direction.y * this.speed;
                    this.depth = this.y + 192;
                    // console.log(this.depth)
                    // console.log(this.depth);
                }

                //  Walked far enough?
                if (Phaser.Math.Distance.Between(this.startX, this.startY, this.x, this.y) >= this.distance)
                {
                    this.direction = directions[this.direction.opposite];
                    this.f = this.anim.startFrame;
                    this.frame = this.texture.get(this.direction.offset + this.f);
                    this.startX = this.x;
                    this.startY = this.y;
                }
            }
        }

    });

    buildMap();
    buildingGroup = this.add.group();
    placeHouses();

    skeletons.push(this.add.existing(new Skeleton(this, w/2-96, h/2-96/1.718-20, 'walk', 'southEast', 150).setOrigin(0.5,1)));
    skeletons.push(this.add.existing(new Skeleton(this, w/2-96*2, h/2-20, 'walk', 'southEast', 200).setOrigin(0.5,1)));
    skeletons.push(this.add.existing(new Skeleton(this, w/2+96*2, h/2-20, 'walk', 'southWest', 300).setOrigin(0.5,1)));
    // skeletons.push(this.add.existing(new Skeleton(this, 100, 380, 'walk', 'southEast', 230)));
    // skeletons.push(this.add.existing(new Skeleton(this, 620, 140, 'walk', 'south', 380)));
    // skeletons.push(this.add.existing(new Skeleton(this, 460, 180, 'idle', 'south', 0)));

    // skeletons.push(this.add.existing(new Skeleton(this, 760, 100, 'attack', 'southEast', 0)));
    // skeletons.push(this.add.existing(new Skeleton(this, 800, 140, 'attack', 'northWest', 0)));

    // skeletons.push(this.add.existing(new Skeleton(this, 750, 480, 'walk', 'east', 200)));

    // skeletons.push(this.add.existing(new Skeleton(this, 1030, 300, 'die', 'west', 0)));

    // skeletons.push(this.add.existing(new Skeleton(this, 1180, 340, 'attack', 'northEast', 0)));

    // skeletons.push(this.add.existing(new Skeleton(this, 1180, 180, 'walk', 'southEast', 160)));

    // skeletons.push(this.add.existing(new Skeleton(this, 1450, 320, 'walk', 'southWest', 320)));
    // skeletons.push(this.add.existing(new Skeleton(this, 1500, 340, 'walk', 'southWest', 340)));
    // skeletons.push(this.add.existing(new Skeleton(this, 1550, 360, 'walk', 'southWest', 330)));

    var mapScale = scene.cache.json.get('map').layers[0].height;
    this.cameras.main.setSize(w, h);
    // this.cameras.main.centerOn(w/2, h/2+96);
    this.cameras.main.centerOn(w/2, h/2+(mapScale-3)*48);
    
    // setTimeout(()=>{
    //     this.cameras.main.zoomTo(0.5, 400);
    // })
    // this.cameras.main.setViewport(w/2, h/2, w, h);

    // this.cameras.main.scrollX = 800;
}

function buildMap ()
{
    //  Parse the data out of the map
    var data = scene.cache.json.get('map');

    var tilewidth = data.tilewidth;
    var tileheight = data.tileheight;

    tileWidthHalf = tilewidth / 2;
    tileHeightHalf = tileheight / 2;

    var layer = data.layers[0].data;

    // map scale
    var mapwidth = data.layers[0].width;
    var mapheight = data.layers[0].height;

    // canvas size
    var canvasWidth = config.width;
    var canvasHeight = config.height;

    // var centerX = mapwidth * tileWidthHalf;
    // var centerY = 16;

    var centerX = canvasWidth/2;
    // var centerY = canvasHeight/2 + 24*mapwidth;
    var centerY = canvasHeight/2;


    var i = 0;

    for (var y = 0; y < mapheight; y++)
    {
        for (var x = 0; x < mapwidth; x++)
        {
            id = layer[i] - 1;

            var tx = (x - y) * tileWidthHalf;
            var ty = (x + y) * tileHeightHalf;

            var tile = scene.add.image(centerX + tx, centerY + ty, 'tiles', id).setOrigin(0.5,1);
            tile.depth = centerY + ty;
            console.log(tile)

            i++;
        }
    }
}


// function placeHouses ()
// {
//     var canvasWidth = config.width;
//     var canvasHeight = config.height;
//     var mapScaleOffset = 0;
//     var gridWidth = 192/2;
//     var gridHeight = 192/2;
//     var nckuShort = scene.add.image(canvasWidth/2, canvasHeight/2+mapScaleOffset , 'ncku-short').setOrigin(0.5, 1);
//     nckuShort.depth = nckuShort.y + 108;
//     var nckuTall = scene.add.image(canvasWidth/2, canvasHeight/2+mapScaleOffset+gridHeight, 'ncku-tall').setOrigin(0.5, 1);
//     nckuTall.depth = nckuTall.y + 108;
//     nckuShort = scene.add.image(canvasWidth/2-gridWidth, canvasHeight/2+mapScaleOffset+gridHeight/2 , 'ncku-short').setOrigin(0.5, 1);
//     nckuShort.depth = nckuShort.y + 108;
//     nckuTall = scene.add.image(canvasWidth/2, canvasHeight/2+mapScaleOffset+2*gridHeight, 'ncku-tall').setOrigin(0.5, 1);
//     nckuTall.depth = nckuTall.y + 108;
//     var bs = scene.add.image(canvasWidth/2-2*gridWidth, canvasHeight/2+mapScaleOffset+2.5*gridHeight, 'bs').setOrigin(0.5,1);
//     bs.depth = bs.y + 36;
//     nckuShort = scene.add.image(canvasWidth/2-gridWidth, canvasHeight/2+mapScaleOffset+2.5*gridHeight , 'ncku-short').setOrigin(0.5, 1);
//     nckuShort.depth = nckuShort.y + 108;
// }

function placeHouses()
{
    var halfW = config.width/2;
    var halfH = config.height/2;
    var offsetWidth = 192/2;
    var offsetHeight = 192/4;

    // var nckuTall = scene.add.image(halfW-offsetWidth, halfH+offsetHeight, 'ncku-tall').setOrigin(0.5, 1);
    // nckuTall.depth = nckuTall.y + 108;
    // var church = scene.add.image(halfW-1*offsetWidth, halfH+3*offsetHeight, 'church').setOrigin(0.5, 1);
    // church.depth = church.y + 108;
    for(var i=0; i<buildingArr.length; i++){
        for(var j=0; j<buildingArr[i].length; j++){
            if(buildingArr[i][j] !== 0){
                positionX = halfW - i*offsetWidth;
                positionY = halfH + i*offsetHeight;
                buildingGroup.create(positionX, positionY, buildingData[buildingArr[i][j]].name).setOrigin(0.5, 1);
                // console.log(buildingGroup.getChildren())
                buildingGroup.getChildren()[i+j].setInteractive(scene.input.makePixelPerfect());
                buildingGroup.getChildren()[i+j].depth = buildingGroup.getChildren()[i+j].y + 108;
                buildingGroup.getChildren()[i+j].name = buildingData[buildingArr[i][j]].name;
                buildingGroup.getChildren()[i+j].on('pointerdown', function (pointer, x, y, event) {
                    text.setText(this.name);
                    if(this.isJump){
                        return false
                    }
                    this.isJump = true;
                    if(lastTile){
                        scene.tweens.add({
                            targets: lastTile,
                            duration: 130,
                            y: '+=20',
                            ease: 'Quad.easeOut',
                        })
                        lastTile.isJump = false;
                        lastTile = null;
                    }
                    scene.tweens.add({
                        targets: this,
                        duration: 130,
                        y: '-=20',
                        ease: 'Quad.easeOut',
                    })
                    lastTile = this;
                    
                    event.stopPropagation();
                });
            }
        }
    }

    // buildingGroup.create(halfW, halfH, 'ncku-short').setOrigin(0.5, 1);
    // buildingGroup.getChildren()[0].setInteractive(scene.input.makePixelPerfect());
    // buildingGroup.getChildren()[0].depth = buildingGroup.getChildren()[0].y + 108;
    // buildingGroup.getChildren()[0].name = 'ncku';

    // buildingGroup.getChildren()[0].on('pointerdown', function (pointer, x, y, event) {
    //     text.setText(this.name);
    //     if(this.isJump){
    //         return false
    //     }
    //     this.isJump = true;
    //     if(lastTile){
    //         scene.tweens.add({
    //             targets: lastTile,
    //             duration: 130,
    //             y: '+=20',
    //             ease: 'Quad.easeOut',
    //         })
    //         lastTile.isJump = false;
    //         lastTile = null;
    //     }
    //     scene.tweens.add({
    //         targets: this,
    //         duration: 130,
    //         y: '-=20',
    //         ease: 'Quad.easeOut',
    //       })
    //     lastTile = this;
        
    //     event.stopPropagation();
    // });
}

function update ()
{
    // this.cameras.main.scrollX += 0.5;
    skeletons.forEach(function (skeleton) {
        skeleton.update();
    });

    var pointer = scene.input.activePointer;
    // console.log(pointer.x)
    // console.log(pointer.prevPosition.x)
    
    // var touchdown = false;
    // scene.input.on('pointerdown', function(){
    //     touchdown = true;
    // })
    // scene.input.on('pointerup', function(){
    //     touchdown = false;
    // })

    if(pointer.justMoved){
        let x = this.cameras.main.midPoint.x - pointer.x + pointer.prevPosition.x
        let y = this.cameras.main.midPoint.y - pointer.y + pointer.prevPosition.y
        this.cameras.main.centerOn(x, y);
    }
    // console.log(pointer.x)

    return;

    if (d)
    {
        this.cameras.main.scrollX -= 0.5;

        if (this.cameras.main.scrollX <= 0)
        {
            d = 0;
        }
    }
    else
    {
        this.cameras.main.scrollX += 0.5;

        if (this.cameras.main.scrollX >= 800)
        {
            d = 1;
        }
    }
}

