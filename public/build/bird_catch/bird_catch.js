(function(){
__jah__.resources["/main.js"] = {data: function (exports, require, module, __filename, __dirname) {
"use strict"  // Use strict JavaScript mode


// Powered By Wonwoo Ro, 2012 with Cocos2D

// Pull in the modules we're going to use
var cocos  = require('cocos2d')   // Import the cocos2d module
  , nodes  = cocos.nodes          // Convenient access to 'nodes'
  , events = require('events')    // Import the events module
  , geo    = require('geometry')  // Import the geometry module
  , ccp    = geo.ccp              // Short hand to create points

var Real = window.parent.Real

// Convenient access to some constructors
var Layer    = nodes.Layer
  , Scene    = nodes.Scene
  , Label    = nodes.Label
  , Director = cocos.Director

/**
 * @class Initial application layer
 * @extends cocos.nodes.Layer
 */

function pickOut(array, idx)
{
    var array1 = array.slice(0, idx)
    var array2 = array.slice(idx+1,array.length)
    return array1.concat(array2)
}

function Player(num, name)
{
    if(num == 0)
    {
        this.sprite = new nodes.Sprite({file:'/resource/player_01.png'})
    }
    else if(num == 1)
    {
        this.sprite = new nodes.Sprite({file:'/resource/player_02.png'})
    }
    else if(num == 2)
    {
        this.sprite = new nodes.Sprite({file:'/resource/player_03.png'})
    }
    else if(num == 3)
    {
        this.sprite = new nodes.Sprite({file:'/resource/player_04.png'})
    }
    
    this.x = 90 + 150 * num
    var x = this.x
    this.sprite.position = ccp(x, 60)
    this.score = 0
    
    this.MoveRequest = function(direction)
    {
        //Send Move Request to Server (Player_Number, direction)
    }
    this.FireRequest = function()
    {
        //Send Fire Request to Server (Player_Number)
    }
    
}

function Bird(type, speed, y)
{
    if(type == 0) // Normal (Brown) Bird
    {
        this.sprite = new nodes.Sprite({file:'/resource/bird_normal.png'})
        this.IsSpecial = false
    }
    else // Special (Gold) Bird
    {
        this.sprite = new nodes.Sprite({file:'/resource/bird_special.png'})
        this.IsSpecial = true
    }
    
    this.speed = speed
    this.y = y
    this.IsDead = false
    
    //Initial Bird Move
    this.sprite.position = ccp(610, y)
    var action = new cocos.actions.MoveTo({duration:speed, position: new geo.Point(0,y)})
    this.sprite.runAction(action)
    
    //Bird Dead
    this.Die = function()
    {
        this.IsDead = true
        this.sprite.scaleY = -1
        
        this.sprite.stopAllActions()
        
        var dy
        dy = 20 - this.y
        action = new cocos.actions.MoveBy({duration:0.8, position: new geo.Point(0, dy)})
        this.sprite.runAction(action)
    }
}

function BirdInitializer(Birds, num) //In the real game, property of birds should be received from the server.
{
    var type, speed, y
    var p
    for(var i = 0; i < num; i++)
    {
        p = Math.random();
        if(p > 0.95)
        {
            type = 1
            speed = Math.random() + 1
        }
        else
        {
            type = 0
            speed = Math.random()*3 + 1
        }
        
        y = Math.floor(250 + Math.random()*200)
        
        
        Birds[i] = new Bird(type, speed, y)
    }
}

function Bullet(player_num, x, y)
{
    this.owner = player_num
    this.sprite = new nodes.Sprite({file: '/resource/bullet.png'})
    this.sprite.scale = 2
    this.sprite.position = ccp(x, y)
    
    //Bullet initial move
    this.sprite.runAction(new cocos.actions.MoveBy({duration:1, position:ccp(0,1000)}))
}

function Blood_Effect(position, parent)
{
    var blood = new nodes.Sprite({file: '/resource/blood.png'})
    blood.scale = 0.5
    blood.position = ccp(position.x, position.y)

    var action1 = new cocos.actions.ScaleBy({duration:0.3, scale:3})
    var action2 = new cocos.actions.FadeOut({duration:0.3})
    var spawn = new cocos.actions.Spawn({actions:[action1, action2]})
    var removeAction = new cocos.actions.CallFunc({
        method:function(target)
        {
            parent.removeChild(target)
        }
    })
    var sequence = new cocos.actions.Sequence({actions:[spawn, removeAction]})
    blood.runAction(sequence)
    return blood
}

function Score_Effect(position, parent, string)
{
    var Popup = new Label({string: string, fontColor: '#000000'})
    Popup.position = ccp(position.x, position.y)
    
    var action1 = new cocos.actions.MoveBy({duration:1, position: ccp(0,100)})
    var action2 = new cocos.actions.FadeOut({duration:1})
    var spawn = new cocos.actions.Spawn({actions:[action1, action2]})
    var removeAction = new cocos.actions.CallFunc({
        method:function(target)
        {
            parent.removeChild(target)
        }
    })
    var sequence = new cocos.actions.Sequence({actions:[spawn, removeAction]})
    
    Popup.runAction(sequence)
    return Popup
    
}

//Ready Scene Layer
function ReadyForGame()
{
    ReadyForGame.superclass.constructor.call(this)
    var s = Director.sharedDirector.winSize
    
    var Title = new Label({string: ' The Bird Catch', fontname: 'Arial', fontSize: 50})
    var info = new Label({string: 'Waiting for the game starts .... '})
    
    var sprite = new nodes.Sprite({file:'/resource/player_01.png'})
    
    Title.position = ccp(s.width/2, (2 * s.height)/3)
    info.position = ccp(180,-30)
    sprite.position = ccp(s.width/2, s.height/3)
    
    this.addChild(Title)
    this.addChild(sprite)
    Title.addChild(info)
    
    
    
    this.schedule({method:"timer", interval: 1.0})
    
    
}
ReadyForGame.inherit(Layer,{
    timer: function(delay)
    {
        if(!this.container)
        {
            this.container = false
        }
        Real.Game.receiveEvent('gameStart', this.container)
        if(this.container)
        {
            var scene = new Scene()
            var layer = new BirdCatch()
            var director = Director.sharedDirector
            
            scene.addChild(layer)
            
            var transition = new nodes.TransitionRotoZoom({duration:1.5, scene: scene})
            director.replaceScene(transition)
        }
    }

})

//End Scene Layer
function GameEnd(GameResult)
{
    GameEnd.superclass.constructor.call(this)
    var s = Director.sharedDirector.winSize
    
    var FinalScore = GameResult.toString()
    
    var lblEnd = new Label({string:'Game Over', fontSize: 50})
    var lblUScore = new Label({string:'Your Score is', fontSize:20})
    var lblResult = new Label({string: FinalScore, fontSize:50})
    
    lblEnd.position = ccp(s.width/2, 2*s.height/3)
    lblUScore.position = ccp(s.width/2, 2*s.height/3 - 50)
    lblResult.position = ccp(s.width/2, 2*s.height/3 - 120)
    
    this.addChild(lblEnd)
    this.addChild(lblUScore)
    this.addChild(lblResult)
    
}
GameEnd.inherit(Layer)

//Main Game Layer
function BirdCatch()
{
    // You must always call the super class constructor
    BirdCatch.superclass.constructor.call(this)

    // Get size of canvas
    var s = Director.sharedDirector.winSize
    this.isKeyboardEnabled = true
    
    //Set Audios
    var bgm = new Audio('/__jah__/assets/sfx/bgm.mp3')
    bgm.loop = true
    bgm.play()
    
    //Set Background Sprite
    var background = new nodes.Sprite({file:'/resource/background.png'})
    background.position = ccp(s.width/2, s.height/2)
    this.addChild(background)
    
    //Set player sprites
    this.Players = new Array()
    this.me_num = 0 //In the real game, this value will be set by the server
    this.me_name = 'Tester'
    
    this.Players[this.me_num] = new Player(this.me_num, this.me_name)
    this.addChild(this.Players[this.me_num].sprite)
    
    //Set Birds
    this.Birds = new Array()
    BirdInitializer(this.Birds, 10)
    for(var i = 0; i < 10; i++)
    {
        this.addChild(this.Birds[i].sprite)
    }
    
    this.keyMap = {}
    this.Bullets = new Array
    this.schedule({method:"GameControl", interval: 0.02})
}
BirdCatch.inherit(Layer, {
    keyDown: function(evt)
    {
        evt.preventDefault()
        this.keyMap[evt.keyCode] = true
    },
    keyUp: function(evt)
    {
        this.keyMap[evt.keyCode] = false
    },
    GameControl: function(delay)
    {
        var speed, y
        var p_x, p_y
        var isOverlap
        
        //Set Bullet Delay
        if(!this.BulletDelay){
            this.BulletDelay = 0
        }
        this.BulletDelay += delay
        
        //Set End Timer
        if(!this.EndTimer){
            this.EndTimer = 0
        }
        this.EndTimer+=delay
        if(this.EndTimer > 60)
        {
            var scene = new Scene()
            var layer = new GameEnd(this.Players[this.me_num].score)
            var director = Director.sharedDirector
            
            scene.addChild(layer)
            
            var transition = new nodes.TransitionRotoZoom({duration:1.5, scene: scene})
            director.replaceScene(transition)
        }
        
        //Handles Player Moves///////////////////////////////
        if(this.keyMap[37] && this.Players[this.me_num].sprite.position.x > 27)
        {
            //this.Players[me_num].moveRequest(LEFT)
            //In the real game, replace the Player sprites if server sends a refreshed information
            this.Players[this.me_num].sprite.position.x = this.Players[this.me_num].sprite.position.x - 8;
        }
        if(this.keyMap[39] && this.Players[this.me_num].sprite.position.x < 614)
        {
            //this.Players[me_num].moveRequest(RIGHT)
            //In the real game, replace the Player sprites if server sends a refreshed information
            this.Players[this.me_num].sprite.position.x = this.Players[this.me_num].sprite.position.x + 8;
        }
        //Handle Player Fires
        if(this.keyMap[32] && this.BulletDelay > 0.5)
        {
            //Originally sends fire request to server
            var gunshotSFX = new Audio('/build/__jah__/assets/sfx/gunshot.wav')
            gunshotSFX.play()
            p_x = this.Players[this.me_num].sprite.position.x - 5
            p_y = this.Players[this.me_num].sprite.position.y + 30
            var bull = new Bullet(this.me_num, p_x, p_y)
            this.addChild(bull.sprite)
            this.Bullets.push(bull)
            this.BulletDelay = 0
        }
        
        //Pick Out Bullets/////////////////////////////////////
        for(var i = 0; i < this.Bullets.length; i++)
        {
            if(this.Bullets[i].sprite.position.y > 700)
            {
                this.removeChild(this.Bullets[i])
                this.Bullets = pickOut(this.Bullets, i)
                break
            }
        }
        
        //Check & Refresh Bird Position////////////////////////////
        for(var i = 0; i < 10; i++)
        {
            if(this.Birds[i].sprite.position.x == 0 && this.Birds[i].IsDead != true)
            {
                if(this.Birds[i].IsSpecial)
                {
                    this.removeChild(this.Birds[i].sprite)
                    this.Birds[i].IsDead = true
                }
                
                this.Birds[i].sprite.position.x = 620
                speed = this.Birds[i].speed
                y = this.Birds[i].y
                this.Birds[i].sprite.runAction(new cocos.actions.MoveTo({duration:speed, position: new geo.Point(0,y)}))
            }
        }
        
        //Check Kill///////////////////////////////////////////////
        isOverlap = false
        
        for(var i = 0; i < 10; i++)
        {
            if(isOverlap) break
            var B = this.Birds[i]
            for(var j = 0; j < this.Bullets.length; j++)
            {
                var M = this.Bullets[j]
                isOverlap = geo.rectOverlapsRect(B.sprite.boundingBox, M.sprite.boundingBox)
                if(isOverlap && !B.IsDead)
                {
                    var bird_dieSFX = new Audio('/__jah__/assets/sfx/bird_die.wav')
                    bird_dieSFX.play()
                    
                    if(B.IsSpecial)
                    {
                        this.Players[this.me_num].score += 1000
                        this.addChild(Score_Effect(B.sprite.position, this,'1000'))
                    }
                    else
                    {
                        this.Players[this.me_num].score += 100
                        this.addChild(Score_Effect(B.sprite.position, this,'100'))
                    }
                    B.Die()
                    this.addChild(Blood_Effect(B.sprite.position, this))
                    
                    this.removeChild(M.sprite)
                    this.Bullets = pickOut(this.Bullets, j)
                }
            }
        }
        
        //If every Birds had been killed
        //Refresh all Birds
        var AllKill = false, count = 0
        for(var i = 0; i < 10; i++)
        {
            if(this.Birds[i].IsDead == false) break
            count++
        }
        if(count == 10) AllKill = true
        if(AllKill)
        {
            for(var i = 0; i < 10; i++)
            {
                this.removeChild(this.Birds[i].sprite)
            }
            BirdInitializer(this.Birds,10)
            for(var i = 0; i < 10; i++)
            {
                this.addChild(this.Birds[i].sprite)
            }
        }
    }

})

/**
 * Entry point for the application
 */
function main () {
    // Initialise application

    // Get director singleton
    var director = Director.sharedDirector

    // Wait for the director to finish preloading our assets
    events.addListener(director, 'ready', function (director) {
        // Create a scene and layer
        var title_scene = new Scene(), t_layer = new ReadyForGame()
        title_scene.addChild(t_layer)

        // Run the scene
        director.replaceScene(title_scene)
    })

    // Preload our assets
    director.runPreloadScene()
}


exports.main = main

}, mimetype: "application/javascript", remote: false}; // END: /main.js


__jah__.resources["/resource/background.png"] = {data: __jah__.assetURL + "/resource/background.png", mimetype: "image/png", remote: true};
__jah__.resources["/resource/bird_normal.png"] = {data: __jah__.assetURL + "/resource/bird_normal.png", mimetype: "image/png", remote: true};
__jah__.resources["/resource/bird_special.png"] = {data: __jah__.assetURL + "/resource/bird_special.png", mimetype: "image/png", remote: true};
__jah__.resources["/resource/blackscreen.png"] = {data: __jah__.assetURL + "/resource/blackscreen.png", mimetype: "image/png", remote: true};
__jah__.resources["/resource/blood.png"] = {data: __jah__.assetURL + "/resource/blood.png", mimetype: "image/png", remote: true};
__jah__.resources["/resource/bullet.png"] = {data: __jah__.assetURL + "/resource/bullet.png", mimetype: "image/png", remote: true};
__jah__.resources["/resource/player_01.png"] = {data: __jah__.assetURL + "/resource/player_01.png", mimetype: "image/png", remote: true};
__jah__.resources["/resource/player_02.png"] = {data: __jah__.assetURL + "/resource/player_02.png", mimetype: "image/png", remote: true};
__jah__.resources["/resource/player_03.png"] = {data: __jah__.assetURL + "/resource/player_03.png", mimetype: "image/png", remote: true};
__jah__.resources["/resource/player_04.png"] = {data: __jah__.assetURL + "/resource/player_04.png", mimetype: "image/png", remote: true};
__jah__.resources["/sfx/bgm.mp3"] = {data: __jah__.assetURL + "/sfx/bgm.mp3", mimetype: "audio/mpeg", remote: true};
__jah__.resources["/sfx/bird_die.wav"] = {data: __jah__.assetURL + "/sfx/bird_die.wav", mimetype: "audio/x-wav", remote: true};
__jah__.resources["/sfx/gunshot.wav"] = {data: __jah__.assetURL + "/sfx/gunshot.wav", mimetype: "audio/x-wav", remote: true};
})();