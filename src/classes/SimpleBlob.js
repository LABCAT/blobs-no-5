import blobshape from "blobshape";

export default class SimpleBlob {
    constructor(p, x, y, size) {
        this.p = p;
        this.x = x;
        this.y = y;
        this.size = size || p.random(p.width / 64, p.width / 32);
        this.growth = parseInt(p.random(2, 6));
        this.edges = parseInt(p.random(4, 12));
        this.seed = p.random(1, 100);
        
        const colorIndices = this.getThreeUniqueRandomIndices(p.colourSet.length);
        this.color1 = p.color(p.colourSet[colorIndices[0]]);
        this.color2 = p.color(p.colourSet[colorIndices[1]]);
        this.color3 = p.color(p.colourSet[colorIndices[2]]);
    }

    getThreeUniqueRandomIndices(max) {
        const indices = new Set();
        while(indices.size < 3) {
            indices.add(Math.floor(this.p.random(0, max)));
        }
        return Array.from(indices);
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

    drawSingleBlob(color, angle = 0, whiteStroke = false) {
        const offset = this.size / 8;
        const offsetX = Math.cos(angle) * offset;
        const offsetY = Math.sin(angle) * offset;

        const { path } = blobshape({ 
            size: this.size, 
            growth: this.growth, 
            edges: this.edges, 
            seed: this.seed 
        });
        
        const pathArray = this.parseSVGPath(path);
        this.p.translate(this.x - (this.size / 2) + offsetX, this.y - (this.size / 2) + offsetY);
        
        this.p.fill(this.p.hue(color), 100, 100, 0.5);
        this.p.stroke(this.p.hue(color), whiteStroke ? 0 : 100, 100, 1);
        
        this.p.beginShape();
        for (let cmd of pathArray) {
            let command = cmd[0];
            let params = cmd.slice(1);
            
            if (command === 'M') {
                this.p.vertex(params[0], params[1]);
            } else if (command === 'Q') {
                this.p.quadraticVertex(params[0], params[1], params[2], params[3]);
            }
        }
        this.p.endShape(this.p.CLOSE);
        this.p.translate(-this.x + (this.size / 2) - offsetX, -this.y + (this.size / 2) - offsetY);
    }

    draw(whiteStroke = false) {
        this.drawSingleBlob(this.color1, 0, whiteStroke);
        this.drawSingleBlob(this.color2, (2 * Math.PI) / 3, whiteStroke);
        this.drawSingleBlob(this.color3, (4 * Math.PI) / 3, whiteStroke);
    }

    update() {
        
    }
}