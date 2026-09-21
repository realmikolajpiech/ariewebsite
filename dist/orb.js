// WebGL port of Arie's native Android fluid orb. Keep the product's visual identity in sync.
(() => {
const canvas=document.querySelector('#arie-orb');
const gl=canvas.getContext('webgl', {alpha:true, premultipliedAlpha:false, antialias:false});
if(!gl){canvas.style.borderRadius='50%';canvas.style.background='radial-gradient(circle at 35% 25%, #91b5ed, #243e69 40%, #101c32 70%)';return;}
const vertex=`attribute vec2 position; void main(){gl_Position=vec4(position,0.0,1.0);}`;
const fragment=`precision highp float;

uniform vec2 resolution;
uniform float time;
uniform float working;
uniform float energy;
uniform float audio;
uniform float speak;
uniform float reveal;

float gaussian(vec2 p, vec2 c, vec2 scale) {
    vec2 d = (p - c) / scale;
    return exp(-dot(d, d));
}

void main() {
    vec2 frag = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
    vec2 p = (frag - resolution * 0.5) / (min(resolution.x, resolution.y) * 0.382);
    float t = time;
    float transitionPulse = sin(clamp(working / 0.46, 0.0, 1.0) * 3.14159)
        * (1.0 - smoothstep(0.46, 0.68, working));
    float breathing = 1.0 + 0.006 * sin(t * 1.35) * energy
        + audio * mix(0.012, 0.02, speak)
        + transitionPulse * 0.018;
    p /= breathing;
    float r = length(p);
    float pixel = 2.0 / min(resolution.x, resolution.y);
    float inside = 1.0 - smoothstep(1.0 - pixel, 1.0 + pixel, r);
    float halo = exp(-pow((r - 1.0) / 0.105, 2.0)) * 0.32;
    halo += exp(-pow((r - 1.0) / 0.24, 2.0)) * 0.07;
    float colorPhase = smoothstep(0.28, 0.96, working);
    float geometryPhase = smoothstep(0.06, 0.72, working);
    halo *= 1.0 + colorPhase * (0.17 * sin(t * 1.18) + 0.07 * sin(t * 2.40));
    halo *= 1.0 + speak * audio * 0.28;
    vec3 haloColor = mix(vec3(0.27, 0.49, 1.0), vec3(0.43, 0.39, 1.0), colorPhase);

    vec3 col = vec3(0.018, 0.035, 0.068);
    // Refraction builds gradually toward the silhouette, leaving a deep, clear center.
    float fresnel = pow(clamp(r, 0.0, 1.0), 5.5);
    float edgeLight = 0.58 + 0.22 * sin(atan(p.y, p.x) * 2.0 + 0.6);
    col += vec3(0.15, 0.31, 0.63) * fresnel * edgeLight;
    float top = gaussian(p, vec2(-0.27, -0.88), vec2(0.69, 0.23));
    col += vec3(0.45, 0.65, 1.0) * top * 0.72;
    col += vec3(0.07, 0.18, 0.41) * gaussian(p, vec2(0.82, -0.06), vec2(0.26, 0.68));

    float bend = sin(p.x * 3.1 - t * 0.53) * (0.15 + energy * 0.025 + audio * 0.05);
    float workingCurve = 0.025 + 0.23 * p.x + 0.075 * sin(p.x * 2.4 + t * 0.32);
    float waveY = mix(0.37 + bend, workingCurve, geometryPhase) + sin(t * 0.37) * 0.035;
    float d = p.y - waveY;
    float crest = exp(-pow(d / mix(0.10, 0.075, geometryPhase), 2.0));
    float underside = smoothstep(-0.07, 0.18, d) * exp(-max(d, 0.0) * 3.1);
    float membrane = (crest * 0.56 + underside * 0.42) * (0.60 + 0.40 * (1.0 - p.x));
    vec3 silver = vec3(0.53, 0.69, 0.93) * membrane;
    silver += vec3(0.19, 0.29, 0.45) * gaussian(p, vec2(0.3, 0.94), vec2(0.85, 0.27));
    col += silver * (1.0 - colorPhase * 0.83);
    // Before the color front arrives, the existing listening membrane charges
    // with cool light. This makes the transition visible from its first beat.
    float chargedMembrane = exp(-pow(d / 0.17, 2.0)) * transitionPulse;
    col += mix(vec3(0.28, 0.57, 1.0), vec3(0.52, 0.36, 0.94), colorPhase)
        * chargedMembrane * 0.58;

    // A continuous translucent surface: two curved boundaries enclose a fold.
    // Color is interpolated across the surface instead of adding isolated lights.
    vec2 q = p;
    q.x += colorPhase * (0.185 * sin(t * 1.08 + p.y * 2.45)
        + 0.068 * sin(t * 1.71 - p.x * 4.10));
    q.y += colorPhase * (0.145 * cos(t * 0.91 - p.x * 3.05)
        + 0.062 * sin(t * 1.39 + p.y * 3.60));
    float z = sqrt(max(0.0, 1.0 - dot(q, q)));
    float upperDrift = 0.175 * sin(t * 0.86) + 0.105 * sin(t * 1.34 + q.x * 3.0);
    float lowerDrift = 0.150 * sin(t * 0.69 + 1.4) + 0.115 * sin(t * 1.12 - q.x * 2.5);
    float upper = -0.045 + 0.19 * q.x + 0.07 * q.x * q.x + upperDrift * z;
    float lower = 0.29 + 0.32 * q.x + 0.06 * q.x * q.x + lowerDrift * z;
    float sheet = smoothstep(upper - 0.075, upper + 0.105, q.y);
    float below = smoothstep(lower - 0.06, lower + 0.24, q.y);
    float across = clamp((q.y - upper) / max(lower - upper, 0.1), 0.0, 1.0);

    vec3 material = vec3(0.035, 0.08, 0.22);
    float blue = gaussian(q, vec2(-0.42 + 0.13 * sin(t * 0.56), -0.59 + 0.09 * cos(t * 0.68)), vec2(0.61, 0.59));
    material = mix(material, vec3(0.14, 0.32, 0.86), blue * 0.80);
    float depth = gaussian(q, vec2(-0.03 + 0.15 * cos(t * 0.48), -0.38 + 0.07 * sin(t * .62)), vec2(0.44, 0.50));
    material *= 1.0 - depth * 0.43;
    float cyanAxis = q.x - (0.49 + 0.24 * sin(t * 0.96) - 0.31 * (q.y + 0.55) * (q.y + 0.55));
    float cyan = exp(-pow(cyanAxis / 0.27, 2.0))
        * exp(-pow((q.y + 0.44) / 0.67, 2.0));
    material = mix(material, vec3(0.29, 0.79, 0.98), cyan * 0.92);
    float pearl = gaussian(q, vec2(0.77 + 0.05 * cos(t * .71), -0.19 + 0.18 * sin(t * 0.64)), vec2(0.18, 0.48));
    material = mix(material, vec3(0.77, 0.85, 1.0), pearl * 0.78);

    float opening = smoothstep(-0.8, 0.85, q.x + 0.14 * sin(t * 0.58));
    vec3 foldTop = mix(vec3(0.57, 0.31, 0.87), vec3(0.80, 0.59, 0.97), opening);
    vec3 foldUnder = mix(vec3(0.24, 0.15, 0.40), vec3(0.48, 0.27, 0.62), opening);
    vec3 folded = mix(foldTop, foldUnder, smoothstep(0.08, 0.94, across));
    material = mix(material, folded, sheet);

    // The underside opens directly into a broad warm crescent, then blue at the pole.
    float warm = 1.0 - smoothstep(-0.35, 0.72, q.x + 0.29 * sin(t * 0.74));
    vec3 bottom = mix(vec3(0.31, 0.32, 0.71), vec3(1.0, 0.73, 0.50), warm);
    float pole = smoothstep(0.57, 1.02, q.y);
    bottom = mix(bottom, vec3(0.15, 0.35, 0.79), pole * 0.85);
    material = mix(material, bottom, below);
    float lip = exp(-pow((q.y - upper) / (0.035 + 0.03 * opening), 2.0));
    float current = gaussian(q, vec2(-0.18 + 0.46 * sin(t * 0.49), 0.12 + 0.30 * cos(t * 0.61)), vec2(0.50, 0.28));
    material += vec3(0.18, 0.10, 0.31) * current * 0.25;
    material += vec3(0.14, 0.075, 0.19) * lip;
    material += vec3(0.14, 0.22, 0.40) * fresnel * 0.45;
    // The material wakes up as a light front travels across the sphere. This
    // avoids a flat crossfade and makes the cool membrane physically become the fold.
    float sweep = mix(-1.22, 1.38, smoothstep(0.045, 0.86, working));
    float frontCoordinate = p.x + 0.30 * p.y - 0.22 * p.y * p.y;
    float wake = 1.0 - smoothstep(sweep - 0.32, sweep + 0.18, frontCoordinate);
    wake *= smoothstep(0.07, 0.40, working);
    float sweepY = mix(0.30, -0.02 + 0.20 * sweep, geometryPhase);
    float movingLight = gaussian(p, vec2(sweep, sweepY), vec2(0.22, 0.52));
    float seamEnergy = exp(-pow((frontCoordinate - sweep) / 0.13, 2.0)) * inside;
    col = mix(col, material, wake);
    col += vec3(0.31, 0.48, 1.0) * movingLight * (1.0 - colorPhase) * 0.62;
    col += mix(vec3(0.43, 0.68, 1.0), vec3(0.76, 0.45, 0.92), colorPhase)
        * seamEnergy * transitionPulse * 0.70;

    // A smooth luminous edge, without separate outlines or sharp arc endpoints.
    float rim = exp(-pow((r - 0.99) / 0.018, 2.0));
    float rimSoft = exp(-pow((r - 0.974) / 0.053, 2.0));
    float rimBrightness = 0.43 + 0.39 * gaussian(p, vec2(-0.38, -0.80), vec2(0.85, 0.75))
        + colorPhase * 0.12 * sin(atan(p.y, p.x) * 2.0 - t * 0.72);
    vec3 rimColor = mix(vec3(0.65, 0.75, 1.0), vec3(0.69, 0.68, 1.0), colorPhase * smoothstep(-0.4, 0.7, p.x));
    col += rimColor * (rim * rimBrightness + rimSoft * 0.24);
    col *= 1.0 + speak * audio * 0.05;
    col = min(col, vec3(1.0));
    // Empty glass first, then liquid climbs the inner wall. A meniscus and
    // traveling caustic keep the rise from reading as a flat wipe.
    float fill = clamp(reveal, 0.0, 1.0);
    float filling = sin(fill * 3.14159);
    float surface = mix(1.36, -1.30, fill);
    surface -= 0.13 * p.x * p.x * (0.50 + 0.50 * filling);
    surface += (0.058 * sin(p.x * 5.8 - t * 2.6) + 0.030 * sin(p.x * 2.6 + t * 1.55))
        * filling * (1.0 - p.x * p.x);
    float liquidFill = smoothstep(surface - 0.045, surface + 0.12, p.y);
    float fillGlow = exp(-pow((p.y - surface) / 0.042, 2.0)) * filling * inside;
    float caustic = exp(-pow((p.y - surface - 0.13) / 0.15, 2.0))
        * exp(-pow(p.x / 0.52, 2.0)) * liquidFill * filling * inside;
    float shellLight = rim * 0.88 + rimSoft * 0.20;
    float emptyGlass = (1.0 - liquidFill) * inside;
    float glassLight = 0.18 + 0.40 * fresnel
        + 0.20 * gaussian(p, vec2(-0.32, -0.72), vec2(0.72, 0.36));
    float alpha = max(inside * mix(0.26, 1.0, liquidFill), max(shellLight, halo));
    vec3 glassColor = mix(vec3(0.035, 0.075, 0.16), vec3(0.20, 0.42, 0.78), fresnel);
    glassColor += vec3(0.50, 0.70, 1.0) * top * 0.28;
    vec3 outputColor = col * inside * liquidFill
        + glassColor * emptyGlass * glassLight
        + vec3(0.62, 0.84, 1.0) * fillGlow * 1.25
        + vec3(0.30, 0.58, 1.0) * caustic * 0.62
        + rimColor * shellLight * (1.0 + filling * 0.22)
        + haloColor * halo * (1.0 - inside) * (1.0 + filling * 0.12);
    gl_FragColor = vec4(outputColor, alpha);
}
`;
function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;}
const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
const uniforms={};['resolution','time','working','energy','audio','speak','reveal'].forEach(key=>uniforms[key]=gl.getUniformLocation(program,key));
let working=.8,target=.8,visible=true,frame=0,last=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function resize(){const size=Math.round(canvas.clientWidth*Math.min(devicePixelRatio,2));canvas.width=size;canvas.height=size;gl.viewport(0,0,size,size);}
const observer=new ResizeObserver(()=>{resize();if(reduced.matches)render(0);});observer.observe(canvas);
function render(t){working+=(target-working)*.025;gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);gl.uniform1f(uniforms.time,t*.001);gl.uniform1f(uniforms.working,working);gl.uniform1f(uniforms.energy,.5);gl.uniform1f(uniforms.audio,0);gl.uniform1f(uniforms.speak,0);gl.uniform1f(uniforms.reveal,1);gl.drawArrays(gl.TRIANGLES,0,6);}
function tick(t){frame=0;if(!visible||document.hidden||reduced.matches)return;if(t-last>32){render(t);last=t;}frame=requestAnimationFrame(tick);}
function resume(){if(!frame&&visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);}
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();}).observe(canvas);
document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',()=>{render(0);resume();});
window.addEventListener('arie-working',e=>{target=e.detail?1:.8;});
resize();render(0);resume();
})();
