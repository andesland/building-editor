import React, { Component } from 'react'
import * as THREE from 'three'
import key from 'keymaster'
var OrbitControls = require('three-orbit-controls')(THREE)
import Shape from 'clipper-js'
import {Clipper} from 'clipsy'
import { GUI } from 'dat-gui'

const rev = (mm) => (mm*20.0)
const normalize = (mm) => (mm/20.0)
const mm = normalize

const showAxes = (object, length=30) => {
  drawArrow([1,0,0], 0XFF0000, object, length)
  drawArrow([0,1,0], 0X00FF00, object, length)
  drawArrow([0,0,1], 0X0000FF, object, length)
}

const drawArrow = (direction, color, parent, length) => {
  const dir = new THREE.Vector3( ...direction );
  dir.normalize();
  const origin = new THREE.Vector3();
  var arrowHelper = new THREE.ArrowHelper( dir, origin, length, color );
  parent.add(arrowHelper)
}

window.rooves =[]

class App extends Component {

  componentDidMount() {

    // let length = gui.add(this.state, 'length', 5, 29).step(1)
    // this.setLength = this.setLength.bind(this)
    // length.onChange(this.setLength)

    const WIDTH = window.innerWidth;
    const HEIGHT = window.innerHeight;
    const EDGES_COLOR = 0xbbbbbb;

    // Set some camera attributes.
    const VIEW_ANGLE = 75;
    const ASPECT = WIDTH / HEIGHT;
    const NEAR = 0.1;
    const FAR = 10000;

    // Get the DOM element to attach to
    const container = document.querySelector('#container');
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio( window.devicePixelRatio );
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    renderer.shadowMap.enabled = true;
    renderer.setSize(WIDTH, HEIGHT);
    // renderer.shadowMapSoft = false;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR )
    camera.position.y = 220;
    camera.position.x = -50;
    camera.position.z = -200;
    camera.lookAt(new THREE.Vector3(0,mm(1500),0))

    const controls = new OrbitControls(camera)
    controls.minPolarAngle = 0// Math.PI/6
    controls.maxPolarAngle = Math.PI / 2.1
    controls.maxDistance = mm(20000)
    controls.minDistance = mm(1000)
    controls.enableZoom = true

    scene.background = new THREE.Color(0xF6F6F6);

    container.appendChild(renderer.domElement);

    const groundMaterial = new THREE.ShadowMaterial();
    groundMaterial.opacity = 0.2
    const groundGeometry = new THREE.PlaneGeometry(800,800);
    let ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    ground.position.y = -mm(200-36); //lower it
    ground.rotation.x = -Math.PI/2; //-90 degrees around the xaxis
    // ground.doubleSided = true;
    scene.add(ground);


    // const gridMaterial = new THREE.MeshLambertMaterial({color: 0xEEEEEE, wireframe: true});
    // const gridGeometry = new THREE.PlaneGeometry(1600,1600,30,30);
    // let grid = new THREE.Mesh(gridGeometry, gridMaterial);
    // grid.receiveShadow = false;
    // grid.position.y = ground.position.y-1; //lower it
    // grid.rotation.x = -Math.PI/2; //-90 degrees around the xaxis
    // scene.add(grid);


    const ambientLight = new THREE.AmbientLight(0xF6F6F6)
    ambientLight.intensity = 0.3;
    scene.add(ambientLight);

    const mainLight = new THREE.HemisphereLight(0xFFFFFF, 0xEBEBD8, 0.7);
    scene.add(mainLight);


    const pointLight = new THREE.PointLight(0xCFCCB4, 0.5, 0, 1);
    // pointLight.shadowCameraVisible = true;
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 2048;
    pointLight.shadow.mapSize.height = 2048;
    pointLight.shadow.bias = 1;
    // pointLight.shadowCameraVisible = true;
    pointLight.position.x = 90;
    pointLight.position.y = 500;
    pointLight.position.z = -300;

    scene.add(pointLight);
    // // const pointLightHelper = new THREE.PointLightHelper(pointLight, 50);
    // // scene.add(pointLightHelper);

    let MicroHouse = new THREE.Object3D();
    // create the sphere's material
    const plywoodMaterial = new THREE.MeshPhongMaterial({color: 0xD5D3BC, shininess: 0});
    const barMaterial = new THREE.MeshPhongMaterial({color: 0xB4B4B2, shininess: 0});

    const spec = {
      width: 3900,
      floorArea: 0,
      frames: 10,
      roof: {
        apex: 3900
      },
      leftWall: {
        height: 2400
      },
      rightWall: {
        height: 2400
      },
      beams: {
        width: 74,
        height: 200,
      }
    }

    spec.floorArea = ((spec.width/2 - 500) * 11000)/1000;

    const opposite = spec.roof.apex-spec.leftWall.height
    const adjacent = spec.width/2
    spec.roof.length = Math.hypot(adjacent, opposite)
    spec.roof.angle = Math.PI/2 - Math.atan(opposite/adjacent)

    document.getElementById('floor-area').innerHTML = spec.floorArea;

    const outerPoints = [
      [0, spec.roof.apex],
      [spec.width/2, spec.rightWall.height],
      [spec.width/2, 0],

        [spec.width/2-84, 0, true],
        [spec.width/2-84, 36, true],
        [spec.width/2-84-74, 36, true],
        [spec.width/2-84-74, 0, true],

        [-spec.width/2+84+74, 0, true],
        [-spec.width/2+84+74, 36, true],
        [-spec.width/2+84, 36, true],
        [-spec.width/2+84, 0, true],

      [-spec.width/2, 0],
      [-spec.width/2, spec.leftWall.height],
    ]
    var outerFramePoints = outerPoints.map(p => new THREE.Vector2(mm(p[0]), mm(p[1])))
    var frameShape = new THREE.Shape(outerFramePoints)

    var paths = [outerPoints.filter(p => !p[2]).map(p => ({X: p[0], Y: p[1]}))]

    const subject = new Shape(paths, true)
    spec.innerPoints = subject.offset(-250, {
      jointType: 'jtMiter',
      endType: 'etClosedPolygon',
      miterLimit: 2,
      roundPrecision: 0
    }).paths[0].map(p => new THREE.Vector2(mm(p.X), mm(p.Y)))

    const innerOpposite = spec.innerPoints[1].y-spec.innerPoints[2].y
    const innerAdjacent = spec.innerPoints[2].x
    spec.roof.innerLength = rev(Math.hypot(innerAdjacent, innerOpposite))
    spec.innerHeight = rev(spec.innerPoints[2].y - spec.innerPoints[3].y)

    // const ip = new Clipper().OffsetPolygons(paths, -250, 0, 2, true)[0]
    // const innerPoints = ip.map(p => new THREE.Vector2(mm(p.X), mm(p.Y)))
    // console.log(paths[0].length, innerPoints.length)


    // var innerFramePoints = [];
    // innerFramePoints.push( new THREE.Vector2 (0, 170) );
    // innerFramePoints.push( new THREE.Vector2 (-90, 100) );
    // innerFramePoints.push( new THREE.Vector2 (-90, 10) );
    // innerFramePoints.push( new THREE.Vector2 (90, 10) );
    // innerFramePoints.push( new THREE.Vector2 (90, 100) );
    var hole = new THREE.Path();
    hole.fromPoints(spec.innerPoints);
    frameShape.holes = [hole];

    var frameGeometry = new THREE.ExtrudeGeometry( frameShape, { steps: 2, amount: mm(150), bevelEnabled: false } );

    var frame,
      distance = mm(1200);
    for (var i = 0; i < spec.frames; i++) {
      frame = new THREE.Mesh(frameGeometry, plywoodMaterial);
      frame.position.z = (i * distance);// -(total/2 * distance);
      frame.position.y = 0;
      frame.receiveShadow = true;
      frame.castShadow = true;
      MicroHouse.add(frame);

      if (EDGES_COLOR) {
        var helper = new THREE.EdgesHelper( frame, EDGES_COLOR );
        helper.position.z = frame.position.z;
        helper.matrixAutoUpdate = true;
        helper.material.linewidth = 2;
        MicroHouse.add(helper);
      }
    }

    var components = [

      ['bar', {
          position: [-mm(spec.width/2 - 84), -mm(200-36), 0],
          shape: [
            [0,0],
            [mm(74), 0],
            [mm(74), mm(200)],
            [0, mm(200)]
          ],
          depth: mm(4800),
          rotation: {
            x: 0,
            y: 0,
            z: 0
          },
          material: barMaterial
        }
      ],

      ['bar', {
          position: [mm(spec.width/2 - 84 - 74), -mm(200-36), 0],
          shape: [
            [0,0],
            [mm(74), 0],
            [mm(74), mm(200)],
            [0, mm(200)]
          ],
          depth: mm(4800),
          rotation: {
            x: 0,
            y: 0,
            z: 0
          },
          material: barMaterial
        }
      ],

      ['roof', {
          position: [0, mm(spec.roof.apex), mm(75)],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.roof.length)],
            [0, mm(spec.roof.length)]
          ],
          depth: mm(40),
          rotation: {
            x: spec.roof.angle - Math.PI,
            y: -Math.PI/2,
            z: 0
          }
        }
      ],

      ['roof', {
          position: [0, mm(spec.roof.apex), mm(75 + 1200)],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.roof.length)],
            [0, mm(spec.roof.length)]
          ],
          depth: mm(40),
          rotation: {
            x: spec.roof.angle,
            y: -Math.PI/2,
            z: - Math.PI
          }
        }
      ],

      ['innerRoof', {
          position: [mm(spec.width/2-250), spec.innerPoints[2].y, mm(75)],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.roof.innerLength - 40)],
            [0, mm(spec.roof.innerLength - 40)]
          ],
          depth: mm(40),
          rotation: {
            x: spec.roof.angle,
            y: -Math.PI/2,
            z: 0
          }
        }
      ],

      ['innerRoof', {
          position: [-mm(spec.width/2-250), spec.innerPoints[2].y, mm(75+1200)],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.roof.innerLength)],
            [0, mm(spec.roof.innerLength)]
          ],
          depth: mm(40),
          rotation: {
            x: spec.roof.angle - Math.PI,
            y: -Math.PI/2,
            z: - Math.PI
          }
        }
      ],

      ['floor', {
          position: [-mm(spec.width/2-250), mm(250), mm(75)],
          shape: [
            [0,0],
              [mm(75),0],
              [mm(75),-mm(250)],
              [mm(1200-75),-mm(250)],
              [mm(1200-75),0],
            [mm(1200), 0],
            [mm(1200), mm(spec.width-500)],
            [0, mm(spec.width-500)]
          ],
          depth: mm(40),
          rotation: {
            x: -Math.PI/2,
            y: -Math.PI/2,
            z: 0
          }
        }
      ],

      ['outerWall', {
          position: [mm(spec.width/2+40), 0, mm(75)],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.leftWall.height)],
            [0, mm(spec.leftWall.height)]
          ],
          depth: mm(40),
          rotation: {
            x: 0,
            y: -Math.PI/2,
            z: 0
          }
        }
      ],

      ['outerWall', {
          position: [-mm(spec.width/2), 0, mm(75)],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.leftWall.height)],
            [0, mm(spec.leftWall.height)]
          ],
          depth: mm(40),
          rotation: {
            x: 0,
            y: -Math.PI/2,
            z: 0
          }
        }
      ],

      ['innerWall', {
          position: [-mm(spec.width/2-250), mm(250+40), mm(75+1200)],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.innerHeight - 80)],
            [0, mm(spec.innerHeight - 80)]
          ],
          depth: mm(40),
          rotation: {
            x: 0,
            y: Math.PI/2,
            z: 0
          }
        }
      ],

      ['innerWall', {
          position: [mm(spec.width/2-250-40), mm(250+40), mm(75+1200)],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.innerHeight - 80)],
            [0, mm(spec.innerHeight - 80)]
          ],
          depth: mm(40),
          rotation: {
            x: 0,
            y: Math.PI/2,
            z: 0
          }
        }
      ]

    ]

    components.forEach(component => {
      const name = component[0]
      const { position, shape, depth, vector, rotation } = component[1]
      let vectorPosition = new THREE.Vector3(...position)
      let points = shape.map(xy => {
        // return vectorPosition.clone().add(
        //   new THREE.Vector3(xy[0], xy[1])
        // )
        // return vectorPosition.clone().add(
          return new THREE.Vector2(xy[0], xy[1])
        // )
      })
      let pointsShape = new THREE.Shape(points)
      let material = component[1].material || plywoodMaterial

      let geom = new THREE.ExtrudeGeometry(pointsShape, { steps: 1, amount: depth, bevelEnabled: false })
      let mesh = new THREE.Mesh(geom, material)

      window[name] = window[name] || []
      window[name].push(mesh)

      let parent = new THREE.Object3D();
      // showAxes(parent, 30)

      parent.position.x = vectorPosition.x;
      parent.position.y = vectorPosition.y;
      parent.position.z = vectorPosition.z;

      parent.rotation.order = 'YZX';
      parent.rotation.x = rotation.x
      parent.rotation.y = rotation.y
      parent.rotation.z = rotation.z

      parent.add(mesh);
      MicroHouse.add(parent);

      mesh.receiveShadow = true;
      mesh.castShadow = true;

      if (EDGES_COLOR) {

        var eg = new THREE.EdgesGeometry( mesh.geometry );
        var em = new THREE.LineBasicMaterial( { color: EDGES_COLOR, linewidth: 1 } );
        var es = new THREE.Line( eg, em, THREE.LinePieces );
        mesh.add( es );

        // var helper =new THREE.EdgesHelper( mesh, EDGES_COLOR );
        // helper.position.z = parent.position.z;
        // helper.position.x = parent.position.x;
        // helper.position.y = parent.position.y;
        // helper.rotation.z = parent.rotation.z;
        // helper.rotation.x = parent.rotation.x;
        // helper.rotation.y = parent.rotation.y;

        // helper.material.linewidth = 2;
        // helper.updateMatrix()
        MicroHouse.add(helper);
      }

    })

    // showAxes(scene, 40);

    var box = new THREE.Box3().setFromObject(MicroHouse)
    // console.log( box.min, box.max, box.size() );
    // MicroHouse.translateZ(box.size().z/2);
    // controls.target.set(0, 20, box.size()/2)
    MicroHouse.add(camera);
    scene.add(MicroHouse);

    controls.update()

    let modifier = 1;
    function update () {
      renderer.render(scene, camera);
      requestAnimationFrame(update);


      if (key.ctrl) {
        modifier = 1.0;
      } else {
        modifier = 10.0;
      }

      if (key.isPressed("w")) { pointLight.translateZ(10/modifier); MicroHouse.translateZ(10/modifier); }
      else if (key.isPressed("s")) { pointLight.translateZ(-10/modifier); MicroHouse.translateZ(-10/modifier); }

      if (key.shift) {
        if (key.isPressed("d")) { MicroHouse.rotation.y += 0.1/modifier; }
        else if (key.isPressed("a")) { MicroHouse.rotation.y -= 0.1/modifier; }
      } else {
        if (key.isPressed("d")) { pointLight.translateX(-10/modifier); MicroHouse.translateX(-10/modifier); }
        else if (key.isPressed("a")) { pointLight.translateX(10/modifier); MicroHouse.translateX(10/modifier); }
      }

    }

    function onWindowResize(){
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth,window.innerHeight);
    }
    window.addEventListener( 'resize', onWindowResize, false );

    update()

    let gui = new GUI()
    var guiControls = {
      toggleRoof: function(){ window['roof'].forEach(roof => roof.visible = false) },
      toggleFloor: function(){ window['floor'].forEach(floor => floor.visible = false) },
    };
    gui.add(guiControls, 'toggleRoof');
    gui.add(guiControls, 'toggleFloor');

  }
  render() {
    return (
      <div id="container" className="App"></div>
    )
  }
}

export default App
