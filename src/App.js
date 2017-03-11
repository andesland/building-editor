import React, { Component } from 'react'
import * as THREE from 'three'

class App extends Component {

  componentDidMount() {

    const WIDTH = window.innerWidth;
    const HEIGHT = window.innerHeight;

    // Set some camera attributes.
    const VIEW_ANGLE = 90;
    const ASPECT = WIDTH / HEIGHT;
    const NEAR = 0.1;
    const FAR = 10000;

    // Get the DOM element to attach to
    const container = document.querySelector('#container');
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.shadowMap.type = THREE.BasicShadowMap;
    renderer.shadowMapEnabled = true
    // renderer.shadowMapSoft = false;

    const camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR );
    const scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xF6F6F6 );

    // camera.position.x = 400;
    camera.position.y = 400;
    camera.position.x = -200;
    camera.position.z = -200;
    camera.lookAt({
        x: 0,
        y: 0,
        z: 0
    });

    // Add the camera to the scene.
    scene.add(camera);

    // Start the renderer.
    renderer.setSize(WIDTH, HEIGHT);

    // Attach the renderer-supplied
    // DOM element.
    container.appendChild(renderer.domElement);


    const groundMaterial = new THREE.ShadowMaterial();
    groundMaterial.opacity = 0.3
    const groundGeometry = new THREE.PlaneGeometry(800,800, 40,40);
    let ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    ground.position.y = -50; //lower it
    ground.rotation.x = -Math.PI/2; //-90 degrees around the xaxis
    // ground.doubleSided = true;
    scene.add(ground);


    const ambientLight = new THREE.AmbientLight(0xCFCCB4)
    ambientLight.intensity = 0.9;
    // ambientLight.castShadow = true;
    scene.add(ambientLight);


    // create a point light
    const pointLight = new THREE.PointLight(0xF2F2DE);
    const pointLightHelper = new THREE.PointLightHelper(pointLight, 50);

    scene.add(pointLightHelper);

    pointLight.intensity = 0.8;
    pointLight.castShadow = true;
    pointLight.shadowCameraVisible = true;
    pointLight.shadowDarkness = 0.01;
    pointLight.shadowMapWidth = 512;
    pointLight.shadowMapHeight = 512;

    // set its position
    pointLight.position.x = 250;
    pointLight.position.y = 350;
    pointLight.position.z = 250;

    // add to the scene
    scene.add(pointLight);

    // create the sphere's material
    const sphereMaterial = new THREE.MeshLambertMaterial({color: 0xF2F2DE});

    // Set up the sphere vars
    const RADIUS = 50;
    const SEGMENTS = 16;
    const RINGS = 16;

    const above = new THREE.Mesh(
      new THREE.CubeGeometry( 100, 100, 100 ),
      sphereMaterial
    )
    above.position.x = 80
    above.position.y = 120
    above.position.z = 20
    above.receiveShadow = true
    above.castShadow = true
    scene.add(above)


    // Create a new mesh with
    // sphere geometry - we will cover
    // the sphereMaterial next!
    const sphere = new THREE.Mesh(

      new THREE.CubeGeometry( 100, 100, 100 ),

      // new THREE.SphereGeometry(
      //   RADIUS,
      //   SEGMENTS,
      //   RINGS),

      sphereMaterial);

    // Move the Sphere back in Z so we
    // can see it.
    sphere.receiveShadow = true;
    sphere.castShadow = true;

    // Finally, add the sphere to the scene.
    scene.add(sphere);

    function update () {
      // Draw!
      renderer.render(scene, camera);

      // Schedule the next frame.
      requestAnimationFrame(update);
    }

    // Schedule the first frame.
    requestAnimationFrame(update);

  }
  render() {
    return (
      <div id="container" className="App"></div>
    )
  }
}

export default App
