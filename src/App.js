import React, { Component } from 'react'
import * as THREE from 'three'
import key from 'keymaster'
var OrbitControls = require('three-orbit-controls')(THREE)
import Shape from 'clipper-js'
import {Clipper} from 'clipsy'

const normalize = (mm) => (mm/100.0)
const mm = normalize

class App extends Component {

  componentDidMount() {

    const WIDTH = window.innerWidth;
    const HEIGHT = window.innerHeight;
    const EDGES_COLOR = 0xAAAAAA;

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

    const controls = new OrbitControls(camera)
    controls.minPolarAngle = 0// Math.PI/6
    controls.maxPolarAngle = Math.PI / 2.1
    controls.maxDistance = 200
    controls.minDistance = 10
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
    ambientLight.intensity = 0.38;
    scene.add(ambientLight);

    const mainLight = new THREE.HemisphereLight(0xFFFFFF, 0xEBEBD8, 0.6);
    scene.add(mainLight);


    const pointLight = new THREE.PointLight(0xCFCCB4, 0.5, 0, 1);
    pointLight.shadowCameraVisible = true;
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 2046;
    pointLight.shadow.mapSize.height = 2046;
    pointLight.position.x = 90;
    pointLight.position.y = 500;
    pointLight.position.z = -300;
    pointLight.shadowCameraVisible = true;
    scene.add(pointLight);
    // // const pointLightHelper = new THREE.PointLightHelper(pointLight, 50);
    // // scene.add(pointLightHelper);

    let MicroHouse = new THREE.Object3D();
    // create the sphere's material
    const plywoodMaterial = new THREE.MeshPhongMaterial({color: 0xD5D3BC, shininess: 0});

    const spec = {
      width: 3900,
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
    const innerPoints = subject.offset(-250, {
      jointType: 'jtMiter',
      endType: 'etClosedPolygon',
      miterLimit: 2,
      roundPrecision: 0
    }).paths[0].map(p => new THREE.Vector2(mm(p.X), mm(p.Y)))
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
    hole.fromPoints(innerPoints);
    frameShape.holes = [hole];

    var frameGeometry = new THREE.ExtrudeGeometry( frameShape, { steps: 2, amount: mm(150), bevelEnabled: false } );

    var frame,
      total = 8,
      distance = mm(1200);
    for (var i = 0; i < total; i++) {
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

      ['roof', {
          position: [0, mm(spec.roof.apex), mm(75) + mm(1200)],
          vector: [0, 0, 1],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.rightWall.height)],
            [0, mm(spec.rightWall.height)]
          ],
          depth: mm(18),
          // width: mm(1200),
          // height: mm(spec.rightWall.height),
          // mirror: [mm(spec.width/2), 0, 0]
        }
      ],

    ]

    components.forEach(component => {
      const name = component[0]
      const { position, shape, depth, vector } = component[1]
      let vectorPosition = new THREE.Vector3(...position)
      let vectorVector = new THREE.Vector3(...vector)
      let points = shape.map(xy => {
        // return vectorPosition.clone().add(
        //   new THREE.Vector3(xy[0], xy[1])
        // )
        // return vectorPosition.clone().add(
          return new THREE.Vector2(xy[0], xy[1])
        // )
      })
      let pointsShape = new THREE.Shape(points)
      let geom = new THREE.ExtrudeGeometry(pointsShape, { steps: 2, amount: depth, bevelEnabled: false })
      let mesh = new THREE.Mesh(geom, plywoodMaterial)

      let parent = new THREE.Object3D();
      parent.add(mesh);
      MicroHouse.add(parent);
      parent.rotation.y = Math.PI/2

      // geom.translate(0, 10, 0);

      console.log(vectorPosition)
      parent.position.x = vectorPosition.x
      parent.position.y = vectorPosition.y
      parent.position.z = vectorPosition.z
      // parent.rotation.z = 1
      // mesh.rotation.y = Math.PI/2;
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      // if (EDGES_COLOR) {
      //   var helper =new THREE.EdgesHelper( mesh, EDGES_COLOR );
      //   helper.position.z = mesh.position.z;
      //   helper.material.linewidth = 2;
      //   // helper.updateMatrix()
      //   MicroHouse.add(helper);
      // }


      var dir = new THREE.Vector3( 1, -0.78, 0 );
      dir.normalize();
      mesh.translateX(dir.x)
      mesh.translateY(dir.y)
      mesh.translateZ(dir.z)
      //normalize the direction vector (convert to vector of length 1)

      var origin = parent.position;
      var length = 100;
      var hex = 0xFF0000;
      var arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
      scene.add( arrowHelper );

    })







    var box = new THREE.Box3().setFromObject(MicroHouse)
    console.log( box.min, box.max, box.size() );
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
  }
  render() {
    return (
      <div id="container" className="App"></div>
    )
  }
}

export default App
