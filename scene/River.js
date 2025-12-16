import * as THREE from "../lib/three.js/build/three.module.js";

// Export a function that returns the configured material
export function createRiverMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Vector3(0.0, 0.3, 0.7) }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            void main() {
                vUv = uv;
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz; 
                gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;
            varying vec3 vWorldPosition;

            float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
            
            float noise(vec2 p) {
                vec2 i = floor(p); vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
                           mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
            }

           float water(vec3 p) {
                float t = uTime / 3.0;
                vec3 p1 = p; p1.z += t * 2.0; p1.x += t * 2.0;
                
                // Change .xz to .xy
                float c1 = noise(p1.xy * 2.0);

                vec3 p2 = p; p2.z += t * 3.0; p2.x += t * 0.52;
                
                // CHANGE 2: Change "/ 5.0" to "* 2.0"
                float c2 = noise(p2.xz * 2.0); 

                vec3 p3 = p; p3.z += t * 4.0; p3.x += t * 0.8;
                
                // CHANGE 3: Change "/ 5.0" to "* 2.0"
                float c3 = noise(p3.xz * 2.0); 

                return (c1 + c2 - c3) / 3.0; 
            }

            vec3 getNormal(vec3 p) {
                float eps = 0.1;
                return normalize(vec3(
                    water(p + vec3(eps, 0, 0)) - water(p + vec3(-eps, 0, 0)),
                    2.0 * eps,
                    water(p + vec3(0, 0, eps)) - water(p + vec3(0, 0, -eps))
                ));
            }

            void main() {
                vec3 p = vWorldPosition;
                vec3 n = getNormal(p);
                vec3 lightDir = normalize(vec3(0.5, 0.8, 0.5));
                vec3 viewDir = normalize(cameraPosition - p);
                vec3 reflectDir = reflect(-lightDir, n);
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), 30.0);
                
                vec3 finalColor = uColor + (vec3(1.0) * spec * 0.8);
                float fresnel = 1.0 - max(dot(viewDir, n), 0.0);
                finalColor += vec3(0.1, 0.4, 0.8) * fresnel * 0.5;
                
                gl_FragColor = vec4(finalColor, 0.9);
            }
        `,
        transparent: true
    });
}