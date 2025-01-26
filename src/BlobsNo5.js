import { Midi } from '@tonejs/midi';
import GradientBlob from './classes/GradientBlob';
import AnimatedBGBlob from './classes/AnimatedBGBlob';
import SimpleBlob from './classes/SimpleBlob';

/** 
 * Add your ogg and mid files in the audio director and update these file names
 */
const audio = new URL("@audio/blobs-no-5.ogg", import.meta.url).href;
const midi = new URL("@audio/blobs-no-5.mid", import.meta.url).href;

const BlobsNo5 = (p) => {
    /** 
     * Core audio properties
     */
    p.song = null;
    p.audioLoaded = false;
    p.songHasFinished = false;

    /** 
     * Preload function - Loading audio and setting up MIDI
     * This runs first, before setup()
     */
    p.preload = () => {
        /** 
         * Log when preload starts
         */
        p.song = p.loadSound(audio, p.loadMidi);
        p.song.onended(() => p.songHasFinished = true);
    };

    p.colourSet = ["#FFC30F", "#581845", "#900C3F", "#C70039", "#FF5733", "#1AC7C4"];

    /** 
     * Setup function - Initialize your canvas and any starting properties
     * This runs once after preload
     */
    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.background(0, 0, 0);
        p.colorMode(p.HSB);
        p.colourSet = p.generateColorSet();
    };

    /** 
     * Main draw loop - This is where your animations happen
     * This runs continuously after setup
     */
    p.draw = () => {
        if(p.audioLoaded && p.song.isPlaying()){
            p.background(0, 0, 0);

            if(p.backgroundBlob) {
                p.backgroundBlob.draw();
                p.backgroundBlob.update();
            }

            for (let i = 0; i < p.blobs.length; i++) {
                const blob = p.blobs[i];
                blob.draw();
                blob.update();
            }
        }
    }

    p.blobs = [];

    p.executeTrack1 = (note) => {
        const { currentCue } = note;

        if(currentCue % 12 === 1) {
            p.blobs = [];
        }

        const sizeRanges = {
            small: [p.width / 48, p.width / 24],
            large: [p.width / 32, p.width / 16]
        };
        const size = p.random(...sizeRanges[currentCue > 48 ? 'small' : 'large']);

        let x, y;
        for (let i = 0; i < 32; i++) {
            x = p.random(p.width / 16, p.width - p.width / 16);
            y = p.random(p.height / 16, p.height - p.height / 16);
            if (!p.checkCollision(x, y, size, p.blobs)) break;
        }

        p.blobs.push(new SimpleBlob(p, x, y, size));
    }

    p.backgroundBlob = null;

    p.executeTrack2 = (note) => {
        if(note.currentCue % 16 === 1){
            p.backgroundBlob = null;
        }

        if(!p.backgroundBlob) {
            p.backgroundBlob = 
                new AnimatedBGBlob(
                    p,
                    p.width / 2,
                    p.height / 2
                );

            console.log(p.backgroundBlob);
            
        } else {
            p.backgroundBlob.reverse();
        }
    }

    p.executeTrack3 = (note) => {
        const size = p.random(p.width / 12, p.width / 6);
        let x, y;

        for (let i = 0; i < 32; i++) {
            x = p.random(p.width / 16, p.width - p.width / 16);
            y = p.random(p.height / 16, p.height - p.height / 16);
            if (!p.checkCollision(x, y, size, p.blobs)) break;
        }

        p.blobs.push(new GradientBlob(p, x, y, size));
    }

    p.checkCollision = (x1, y1, r1, blobs) => {
        for (let blob of blobs) {
            const dx = x1 - blob.x;
            const dy = y1 - blob.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < (r1 + blob.size)) {
                return true;
            }
        }
        return false;
    };

    p.generateColorSet = (count = 6) => {
        const hslToHex = (h, s, l) => {
            l /= 100;
            const a = s * Math.min(l, 1 - l) / 100;
            const f = n => {
                const k = (n + h / 30) % 12;
                const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                return Math.round(255 * color).toString(16).padStart(2, '0');
            };
            return `#${f(0)}${f(8)}${f(4)}`;
        }

        const baseHue = Math.floor(Math.random() * 360);
        const colors = [];

        for (let i = 0; i < count; i++) {
            const hue = (baseHue + (360 / count) * i) % 360;
            const saturation = Math.floor(Math.random() * 30) + 70;
            const lightness = Math.floor(Math.random() * 40) + 30;
            colors.push(hslToHex(hue, saturation, lightness));
        }

        return colors;
    }

    /** 
     * MIDI loading and processing
     * Handles synchronization between audio and visuals
     */
    p.loadMidi = () => {
        Midi.fromUrl(midi).then((result) => {
            /** 
             * Log when MIDI is loaded
             */
            console.log('MIDI loaded:', result);
            /** 
             * Example: Schedule different tracks for different visual elements
             */
            const track1 = result.tracks[6].notes; // Layers Wave Edition - Keep On 
            const track2 = result.tracks[9].notes; // Europa - Blower Bass
            const track3 = result.tracks[4].notes; // Layers Wave Edition - Arpegiate ME
            p.scheduleCueSet(track1, 'executeTrack1');
            p.scheduleCueSet(track2, 'executeTrack2');
            p.scheduleCueSet(track3, 'executeTrack3');
            /** 
             * Update UI elements when loaded
             */
            document.getElementById("loader").classList.add("loading--complete");
            document.getElementById('play-icon').classList.add('fade-in');
            p.audioLoaded = true;
        });
    };

    /** 
     * Schedule MIDI cues to trigger animations
     * @param {Array} noteSet - Array of MIDI notes
     * @param {String} callbackName - Name of the callback function to execute
     * @param {Boolean} polyMode - Allow multiple notes at same time if true
     */
    p.scheduleCueSet = (noteSet, callbackName, polyMode = false) => {
        let lastTicks = -1,
            currentCue = 1;
        for (let i = 0; i < noteSet.length; i++) {
            const note = noteSet[i],
                { ticks, time } = note;
            if(ticks !== lastTicks || polyMode){
                note.currentCue = currentCue;
                p.song.addCue(time, p[callbackName], note);
                lastTicks = ticks;
                currentCue++;
            }
        }
    }

    /** 
     * Handle mouse/touch interaction
     * Controls play/pause and reset functionality
     */
    p.mousePressed = () => {
        if(p.audioLoaded){
            if (p.song.isPlaying()) {
                p.song.pause();
            } else {
                if (parseInt(p.song.currentTime()) >= parseInt(p.song.buffer.duration)) {
                    /** 
                     * Reset animation properties here
                     */
                }
                document.getElementById("play-icon").classList.remove("fade-in");
                p.song.play();
            }
        }
    }
};

export default BlobsNo5;