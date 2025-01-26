import blobshape from "blobshape";

export default class AnimatedBGBlob {
    constructor(p, x, y) {
        this.p = p;
        this.x = x;
        this.y = y;
        this.speed = 8;
        this.size = 0;
        this.growth = parseInt(p.random(3, 9));
        this.edges = parseInt(p.random(8, 16));
        this.seed = p.random(1, 100);
        this.colorIndex = parseInt(p.random(0, p.colourSet.length));
        this.fillHue = p.random(0, 360);
        this.strokeHue = p.random(0, 360);
        this.time = 0;
        this.timeSpeed = 0.05;
        this.pathArray1 = this.createPathArray(this.size);
        this.pathArray2 = this.createPathArray(this.size * 2);
        this.pathArray3 = this.createPathArray(this.size * 4);
        this.grow = true;
        this.growMultiplier = 1.6;
        this.shrinkMultiplier = 1.8;
    }

    reverse = () => {
        this.grow = !this.grow;
    }

    createPathArray(size) {
        const { path } = blobshape({
            size: size,
            growth: this.growth,
            edges: this.edges,
            seed: this.seed
        });
        return this.parseSVGPath(path);
    }

    parseSVGPath = (pathData) => {
        let commands = pathData.match(/[a-df-z][^a-df-z]*/gi);
        let pathArray = [];
        for (let cmd of commands) {
            let command = cmd.charAt(0);
            let params = cmd.slice(1).split(/[\s,]+/).map(Number);
            pathArray.push([command, ...params]);
        }
        return pathArray;
    }

    perturbVertex(x, y, index) {
        let offsetX = Math.sin(this.time + index) * 10;
        let offsetY = Math.cos(this.time + index) * 10;
        return [x + offsetX, y + offsetY];
    }

    update() {
        if(this.grow) {
            this.time += this.timeSpeed;
            this.size += this.speed * this.growMultiplier;
        } else {
            this.time -= this.timeSpeed;
            this.size -= this.speed * this.shrinkMultiplier;
        }
        this.pathArray1 = this.createPathArray(this.size);
        this.pathArray2 = this.createPathArray(this.size * 2);
        this.pathArray3 = this.createPathArray(this.size * 4);
    }

    drawBlob(pathArray, translateX, translateY) {
        this.p.push();
        this.p.translate(translateX, translateY);
        
        const fillC = this.p.color(this.p.colourSet[this.colorIndex]);
        const strokeC = this.p.color(this.p.colourSet[(this.colorIndex + 1) % this.p.colourSet.length]);
        
        this.p.fill(this.p.hue(fillC), this.p.saturation(fillC), this.p.brightness(fillC), 0.33);
        this.p.strokeWeight(8);
        this.p.stroke(this.p.hue(strokeC), this.p.saturation(strokeC), this.p.brightness(strokeC), 0.66);
        this.p.beginShape();
        
        for (let i = 0; i < pathArray.length; i++) {
            let cmd = pathArray[i];
            let command = cmd[0];
            let params = cmd.slice(1);
            
            if ((i < 2 || i > pathArray.length - 3) && command === 'M') {
                this.p.vertex(params[0], params[1]);
            } else if ((i < 2 || i > pathArray.length - 3) && command === 'Q') {
                this.p.quadraticVertex(params[0], params[1], params[2], params[3]);
            } else {
                if (command === 'M') {
                    let [perturbedX, perturbedY] = this.perturbVertex(params[0], params[1], i);
                    this.p.vertex(perturbedX, perturbedY);
                } else if (command === 'Q') {
                    let [perturbedX1, perturbedY1] = this.perturbVertex(params[0], params[1], i);
                    let [perturbedX2, perturbedY2] = this.perturbVertex(params[2], params[3], i + 1);
                    this.p.quadraticVertex(perturbedX1, perturbedY1, perturbedX2, perturbedY2);
                }
            }
        }
        this.p.endShape(this.p.CLOSE);
        this.p.pop();
    }

    draw() {
        const translateX1 = this.x - this.size / 2;
        const translateY1 = this.y - this.size / 2;
        this.drawBlob(this.pathArray1, translateX1, translateY1);

        const translateX2 = this.x - this.size;
        const translateY2 = this.y - this.size;
        this.drawBlob(this.pathArray2, translateX2, translateY2);

        const translateX3 = this.x - this.size * 2;
        const translateY3 = this.y - this.size * 2;
        this.drawBlob(this.pathArray3, translateX3, translateY3);
    }
}