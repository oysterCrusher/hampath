(function() {

    function generateSimplePath(width, height) {
        var path = {};
        var data = [];
        for (var y = 0; y < height; y++) {
            data.push([]);
            for (var x = 0; x < width; x++) {
                if (y % 2 === 0) {
                    if (x === width - 1) {
                        data[y].push([x, y + 1]);
                    } else {
                        data[y].push([x + 1, y]);
                    }
                } else {
                    if (x === 0) {
                        data[y].push([x, y + 1]);
                    } else {
                        data[y].push([x - 1, y]);
                    }
                }
            }
        }

        path.start = [0, 0];
        if (y % 2 === 0) {
            path.end = [0, height - 1];
        } else {
            path.end = [width - 1, height - 1];
        }
        data[path.end[1]][path.end[0]] = [-1, -1];
        path.data = data;
        path.width = width;
        path.height = height;

        return path;
    }

    function step(hampath) {
        var s = hampath.start;
        var d = hampath.data;
        var w = d[0].length;
        var h = d.length;
        var dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // Possible direction vectors on the grid
        var dir;
        var validDir = false;

        // Pick a random direction
        while (!validDir) {
            validDir = true;
            dir = dirs[Math.floor(Math.random() * 4)];
            // Not valid to move off the ends of the grid, or in the direction the start is already connected to.
            if (s[0] + dir[0] < 0 || s[0] + dir[0] > w - 1 || s[1] + dir[1] < 0 || s[1] + dir[1] > h - 1) {
                validDir = false;
            } else if (d[s[1]][s[0]][0] === s[0] + dir[0] && d[s[1]][s[0]][1] === s[1]) {
                validDir = false;
            }
        }

        // Make a note of the old start connection
        var osd = [d[s[1]][s[0]][0], d[s[1]][s[0]][1]];

        // Connect the old start point in the new direction
        d[s[1]][s[0]][0] = s[0] + dir[0];
        d[s[1]][s[0]][1] = s[1] + dir[1];

        // From the old start, follow the path and reverse the connections until the new start is reached
        var last = [s[0], s[1]];
        var curr = [s[0], s[1]];
        var next = [osd[0], osd[1]];
        while (next[0] !== s[0] + dir[0] || next[1] !== s[1] + dir[1]) {
            last[0] = curr[0];
            last[1] = curr[1];
            curr[0] = next[0];
            curr[1] = next[1];
            next[0] = d[curr[1]][curr[0]][0];
            next[1] = d[curr[1]][curr[0]][1];
            d[curr[1]][curr[0]][0] = last[0];
            d[curr[1]][curr[0]][1] = last[1];
        }
        s[0] = curr[0];
        s[1] = curr[1];
    }

    function reverse(path) {
        var s = path.start;
        var d = path.data;

        var last = [s[0], s[1]];
        var curr = [s[0], s[1]];
        var next = [d[s[1]][s[0]][0], d[s[1]][s[0]][1]];
        d[s[1]][s[0]][0] = -1;
        d[s[1]][s[0]][1] = -1;

        do {
            last[0] = curr[0];
            last[1] = curr[1];
            curr[0] = next[0];
            curr[1] = next[1];
            next[0] = d[curr[1]][curr[0]][0];
            next[1] = d[curr[1]][curr[0]][1];
            d[curr[1]][curr[0]][0] = last[0];
            d[curr[1]][curr[0]][1] = last[1];
        } while (next[0] !== -1 || next[1] !== -1);

        path.end[0] = path.start[0];
        path.end[1] = path.start[1];
        path.start[0] = curr[0];
        path.start[1] = curr[1];
    }

    function convertToSequence(path) {
        var d = path.data;
        var sequence = [];
        var curr = [path.start[0], path.start[1]];
        var next = [path.start[0], path.start[1]];
        do {
            curr[0] = next[0];
            curr[1] = next[1];
            sequence.push([curr[0], curr[1]]);
            next[0] = d[curr[1]][curr[0]][0];
            next[1] = d[curr[1]][curr[0]][1];
        } while (next[0] !== -1 || next[1] !== -1);
        path.data = sequence;
    }

    /* Returns a random looking Hamiltonian path.
     * Notes: First generates a basic Hamiltonian path then performs a series of randomizing steps.
     * The number of steps has been set to width"2 * height^2 * 0.1 which is generally large enough
     * to create a random looking path. The path is periodically reversed since the step function
     * only moves the start point, allowing both start and end points to be somewhat randomized */
    function generate(opts) {
        opts = opts || {};
        var w = opts.width || 8;
        var h = opts.height || 8;

        var path = generateSimplePath(w, h);

        var nSuccessful = 0;
        for (var i = 0; i < w * w * h * h * 0.1; i++) {
            if ((i + 1) % Math.max(w,h) === 0) {
                reverse(path);
            }
            step(path);
            nSuccessful++;
        }

        convertToSequence(path);

        return path;
    }

    /* Handy function for drawing the path to a canvas */
    function draw(path, opts) {
        opts = opts || {};
        var cw = opts.width || 32;
        var fg = opts.color || 'rgba(0,0,0,1)';
        var bg = opts.background || 'rgba(0,0,0,0)';
        var tc = opts.tails || 'rgba(200,0,0,1)';
        var th = opts.thickness || 0.5;

        var cellSize = cw / path.width;

        var d = path.data;
        var dl = d.length - 1;

        th = Math.round(cw / path.width * th);

        var can = document.createElement('canvas');
        can.width = cw;
        can.height = cw * path.height / path.width;

        var ctx = can.getContext('2d');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, can.width, can.height);

        ctx.strokeStyle = fg;
        ctx.lineWidth = th;
        ctx.beginPath();
        ctx.moveTo((d[0][0] + 0.5) * cellSize, (d[0][1] + 0.5) * cellSize);
        for (var i = 0; i < d.length; i++) {
            ctx.lineTo((d[i][0] + 0.5) * cellSize, (d[i][1] + 0.5) * cellSize);
        }
        ctx.stroke();

        ctx.fillStyle = tc;
        ctx.fillRect((d[0][0] + 0.5) * cellSize - th / 2, (d[0][1] + 0.5) * cellSize - th / 2, th, th);
        ctx.fillRect((d[dl][0] + 0.5) * cellSize - th / 2, (d[dl][1] + 0.5) * cellSize - th / 2, th, th);

        return can;
    }

    window.hampath = {
        generate : generate,
        draw : draw
    };

})();