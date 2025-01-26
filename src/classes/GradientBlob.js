import blobshape from "blobshape";

export default class GradientBlob {
    constructor(p, x, y, size) {
        this.p = p;
        this.x = x;
        this.y = y;
        this.speed = 8;
         this.size = size || p.random(p.width / 16, p.width / 8);
        this.growth = parseInt(p.random(2, 6));
        this.edges = parseInt(p.random(4, 12));
        this.seed = p.random(1, 100);
        this.time = 0;
        this.timeSpeed = 0.02;
        this.colors = p.colourSet;
        this.currentGradient = this.createGradient();
    }

    createGradient() {
        const gradientStops = [];
        const iniColor = this.colors[Math.floor(this.p.random(0, this.colors.length))];
        const amount = Math.floor(this.p.random(3, 6));
        
        gradientStops.push({ stop: 0, color: iniColor });
        for (let i = 0; i < amount; i++) {
            gradientStops.push({
                stop: 1 / (amount + 2) * (i + 1),
                color: this.colors[Math.floor(this.p.random(0, this.colors.length))]
            });
        }
        gradientStops.push({ stop: 1, color: iniColor });
        
        return gradientStops;
    }

    getBlobPath(scale = 1) {
        const { path } = blobshape({
            size: this.size * scale,
            growth: this.growth,
            edges: this.edges,
            seed: this.seed
        });
        return this.parseSVGPath(path);
    }

    parseSVGPath(pathData) {
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
        const scale = 4;
        let offsetX = Math.sin(this.time + index * 0.5) * scale;
        let offsetY = Math.cos(this.time + index * 0.5) * scale;
        return [x + offsetX, y + offsetY];
    }

    update() {
        this.time += this.timeSpeed;
        if (this.time % 60 === 0) {
            this.currentGradient = this.createGradient();
        }
    }

    drawShape(pathArray, gradient, scale) {
        const ctx = this.p.drawingContext;
        ctx.strokeStyle = gradient;
        this.p.noFill();
        this.p.strokeWeight(this.size * 0.2 * scale);
        
        this.p.beginShape();
        for (let i = 0; i < pathArray.length; i++) {
            let cmd = pathArray[i];
            if ((i < 2 || i > pathArray.length - 3) && cmd[0] === 'M') {
                this.p.vertex(cmd[1], cmd[2]);
            } else if ((i < 2 || i > pathArray.length - 3) && cmd[0] === 'Q') {
                this.p.quadraticVertex(cmd[1], cmd[2], cmd[3], cmd[4]);
            } else {
                if (cmd[0] === 'M') {
                    let [perturbedX, perturbedY] = this.perturbVertex(cmd[1], cmd[2], i);
                    this.p.vertex(perturbedX, perturbedY);
                } else if (cmd[0] === 'Q') {
                    let [perturbedX1, perturbedY1] = this.perturbVertex(cmd[1], cmd[2], i);
                    let [perturbedX2, perturbedY2] = this.perturbVertex(cmd[3], cmd[4], i + 1);
                    this.p.quadraticVertex(perturbedX1, perturbedY1, perturbedX2, perturbedY2);
                }
            }
        }
        this.p.endShape(this.p.CLOSE);
    }

    draw() {
        const translateX = this.x - this.size / 2;
        const translateY = this.y - this.size / 2;
        const ctx = this.p.drawingContext;
        
        this.p.noFill();
        this.p.push();
        this.p.translate(translateX, translateY);

        // Draw shapes from largest to smallest
        const scales = [1, 0.8, 0.6];
        scales.forEach((scale, i) => {
            const pathArray = this.getBlobPath(scale);
            const centerOffset = this.size * (1 - scale) / 2;
            this.p.translate(centerOffset, centerOffset);
            const gradient = ctx.createConicGradient(
                (this.time * 2) + (i * Math.PI / 2),
                (this.size * scale) / 2,
                (this.size * scale) / 2
            );
            
            this.currentGradient.forEach(stop => {
                gradient.addColorStop(stop.stop, stop.color);
            });
            
            this.drawShape(pathArray, gradient, scale);
            this.p.translate(-centerOffset, -centerOffset);
        });
        
        this.p.pop();
    }
}