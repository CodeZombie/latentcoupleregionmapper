//create a class called Region
class Region {
    #weight = 1;
    constructor(x, y, width, height, prompt, weight) {
        this.enabled = true;
        this.x = x;
        this.y = y;
        this.width = Math.max(width, 16);
        this.height = Math.max(height, 16);
        this.prompt = prompt;
        this.weight = weight;
        this.mouse_drag_offset = { x: 0, y: 0 };
        this.tool_operation_mode = "none";
        this.selected = false;
    }
    get weight() {
        return this.#weight;
    }
    set weight(value) {
        if (value > 1) {
            value = 1;
        } else if (value < -1) {
            value = -1;
        }
        this.#weight = value;
    }
    snap(canvas_width, canvas_height, rows, columns) {
        this.stayWithinBounds(canvas_width, canvas_height);
        let cell_width = Math.round(canvas_width / columns);
        let cell_height = Math.round(canvas_height / rows);
        //snap the x and y values to the nearest grid point
        this.x = Math.round(this.x / cell_width) * cell_width;
        this.y = Math.round(this.y / cell_height) * cell_height;

        this.width = Math.max(Math.round(this.width / cell_width) * cell_width, 16);
        this.height = Math.max(Math.round(this.height / cell_height) * cell_height, 16);
        
    }

    getRatios(canvas_width, canvas_height) {
        let w = canvas_width / (this.width)
        let h = canvas_height / (this.height)
        return {
            division: [h, w],
            position: [this.y / (canvas_height / h), this.x / (canvas_width / w)]
        };
    }

    onMouseMove(mouse_position, canvas_width, canvas_height) {
        if (this.enabled == false) {
            return
        }
        if (this.selected) {
            if(this.tool_operation_mode == "move") {
                this.move({
                    x: mouse_position.x - this.mouse_drag_offset.x, 
                    y: mouse_position.y - this.mouse_drag_offset.y},
                    canvas_width, canvas_height);
            }
            if(this.tool_operation_mode == "scale") {
                this.scale({
                    x: mouse_position.x, 
                    y: mouse_position.y},
                    canvas_width, canvas_height);
            }
        }
    }

    selectIfMouseOver(mouse_position) {
        if (this.enabled == false) {
            return
        }
        //determine if the mouse is over this region.
        if (this.pointInside(mouse_position)) {
            this.mouse_drag_offset = { x: mouse_position.x - this.x, y: mouse_position.y - this.y };
            this.selected = true;
            this.tool_operation_mode = "move";
        }

        //determine if the mouse is over the scale control
        if (this.pointInsideScaleControl(mouse_position)) {
            this.tool_operation_mode = "scale";
        }

        return this.selected;
    }

    // When the mouse is clicked and released.
    onMouseUp(mouse_position) {
        if (this.enabled == false) {
            return
        }
        if (this.selected) {
            this.selected = false;
            this.tool_operation_mode = "none";
        }
    }

    // When the mouse leaves the canvas element.
    onMouseLeave(canvas_width, canvas_height) {
        if (this.enabled == false) {
            return
        }
        if (this.selected) {
            this.selected = false;
            this.tool_operation_mode = "none";
            //move this region so that is back within the bounds of the canvas
            this.stayWithinBounds(canvas_width, canvas_height);
        }
    }
    
    stayWithinBounds(canvas_width, canvas_height) {
        this.stayInBoundsWhileMoving(canvas_width, canvas_height);
        this.stayWithinBoundsWhileScaling(canvas_width, canvas_height);
    }

    stayWithinBoundsWhileScaling(canvas_width, canvas_height) {
        if (this.x + this.width > canvas_width) {
            this.width = canvas_width - this.x;
        }
        if (this.y + this.height > canvas_height) {
            this.height = canvas_height - this.y;
        }
    }


    stayInBoundsWhileMoving(canvas_width, canvas_height) {
        this.x = Math.max(0, Math.min(this.x, canvas_width - this.width));
        this.y = Math.max(0, Math.min(this.y, canvas_height - this.height));
    }

    move(point, canvas_width, canvas_height) {
        this.x = Math.round(point.x);
        this.y = Math.round(point.y);
        this.stayInBoundsWhileMoving(canvas_width, canvas_height);
    }

    scale(point, canvas_width, canvas_height) {
        console.log("Scaling")
        this.width = point.x - this.x + 8;
        this.height = point.y - this.y + 8;
        //ensure that the width and height of the region are not less than 1
        if (this.width < 16) {
            this.width = 16;
        }
        if (this.height < 16) {
            this.height = 16;
        }
        this.stayWithinBoundsWhileScaling(canvas_width, canvas_height);
    }

    pointInside(point) {
        return (
            point.x >= this.x &&
            point.x <= this.x + this.width &&
            point.y >= this.y &&
            point.y <= this.y + this.height
        );
    }

    pointInsideScaleControl(point) {
        return (
            point.x >= this.x + this.width - 16 &&
            point.x <= this.x + this.width &&
            point.y >= this.y + this.height - 16 &&
            point.y <= this.y + this.height);

    }

    draw(ctx, label) {
        if (this.enabled == false) {
            return
        }
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.lineWidth = 1;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.stroke();
        ctx.closePath();
        //draw a red rangle in the bottom-right corner
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.fillRect(this.x + this.width - 16, this.y + this.height - 16, 16, 16);
        ctx.stroke();
        ctx.closePath();

        //draw a white line around the region
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,1)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.closePath();
        ctx.fill();

        if(this.selected) {
            ctx.beginPath();
            //set color to red
            ctx.strokeStyle = 'rgba(255,0,0,1)';
            ctx.lineWidth = 4;
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.stroke();
            ctx.closePath();
        }
        //draw the label text inside the rectangle
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, this.x + this.width / 2, this.y + this.height / 2);

    }
}

var latent_couple_mapper = new Vue({
    el: '#latent_couple_mapper',
    mounted:function(){
        this.redrawCanvas();
    },
    data: {
        regions: [],
        grid_enabled: true,
        grid_rows: 8,
        grid_columns: 8,
        image_loaded: false,
        image_resource: null,
        canvas_width: 512,
        canvas_height: 512,
        global_region: new Region(0, 0, 512, 512, "", 0.2),
        instructions_visible: false,
        
    },
    watch: {
        canvas_width: function() {
            this.$refs.canvas.width = Math.max(this.canvas_width, 64);
            this.global_region.width = this.$refs.canvas.width;
            for(let i = 0; i < this.regions.length; i++) {
                this.regions[i].stayWithinBounds(this.$refs.canvas.width, this.$refs.canvas.height);
            }
            this.redrawCanvas();
        },
        canvas_height: function() {

            this.$refs.canvas.height = Math.max(this.canvas_height, 64);
            this.global_region.height = this.$refs.canvas.height;
            for(let i = 0; i < this.regions.length; i++) {
                this.regions[i].stayWithinBounds(this.$refs.canvas.width, this.$refs.canvas.height);
            }
            this.redrawCanvas();
        },
        regions: {
            handler(_) {
                this.redrawCanvas();
            },
            deep: true
        },
        grid_enabled: function(enabled) {
            this.redrawCanvas();
            
        },
        grid_rows: function(rows) {
            this.redrawCanvas();
            
        },
        grid_columns: function(columns) {
            this.redrawCanvas();
            
        }
    },
    methods: {
        toggle_instructions: function() {
            this.instructions_visible = !this.instructions_visible;
        },
        canvas_loaded: function() {
            return this.$refs.canvas != null;
        },
        divisions: function() {
            if (this.canvas_loaded() == false) {
                return "???";
            }
            output = ""
            all_regions = [this.global_region].concat(this.regions).filter(function(region) {
                return region.enabled;
            });
            for (var i = 0; i < all_regions.length; i++) {
                d = all_regions[i].getRatios(this.$refs.canvas.width, this.$refs.canvas.height).division
                output += `${d[0].toFixed(2)}:${d[1].toFixed(2)}`
                if (i < all_regions.length - 1) {
                    output += ',';
                }
            }
            return output;
        },
        positions: function() {
            if (this.canvas_loaded() == false) {
                return "???";
            }
            output = ""
            all_regions = [this.global_region].concat(this.regions).filter(function(region) {
                return region.enabled;
            });
            for (var i = 0; i < all_regions.length; i++) {
                p = all_regions[i].getRatios(this.$refs.canvas.width, this.$refs.canvas.height).position
                output += `${p[0].toFixed(2)}:${p[1].toFixed(2)}`
                if (i < all_regions.length - 1) {
                    output += ',';
                }
            }
            return output;
        },
        weights: function() {
            if (this.canvas_loaded() == false) {
                return "???";
            }
            output = ""
            all_regions = [this.global_region].concat(this.regions).filter(function(region) {
                return region.enabled;
            });
            for (var i = 0; i < all_regions.length; i++) {
                output += all_regions[i].weight.toFixed(2).toString()
                if (i < all_regions.length - 1) {
                    output += ',';
                }
            }
            return output;
        },
        prompt: function() {
            output = ""
            all_regions = [this.global_region].concat(this.regions).filter(function(region) {
                return region.enabled;
            });
            for (var i = 0; i < all_regions.length; i++) {
                output += all_regions[i].prompt
                if (i < all_regions.length - 1) {
                    output += '\nAND ';
                }
            }
            return output;
        },
        setCanvasWidth(canvas_width) {
            this.$refs.canvas.width = canvas_width;
            this.redrawCanvas();
        },
        setCanvasHeight(canvas_height) {
            this.$refs.canvas.height = canvas_height;
            this.redrawCanvas();
        },
        uploadImage: function(e) {
            this.image_loaded = false;
            const reader = new FileReader();
            reader.onload = (event) => {
                this.image_resource = new Image();
                this.image_resource.onload = () => {
                    this.canvas_width = this.image_resource.width;
                    this.canvas_height = this.image_resource.height;
                    this.image_loaded = true;
                    for(let i = 0; i < this.regions.length; i++) {
                        this.regions[i].stayWithinBounds(this.$refs.canvas.width, this.$refs.canvas.height);
                    }
                    this.redrawCanvas();
                };
                this.image_resource.src = event.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
            
        },

        selectNone: function() {
            for (let i = 0; i < this.regions.length; i++) {
                this.regions[i].selected = false;
            }
            this.redrawCanvas();
        },

        selectRegion: function(region) {
            this.selectNone();
            region.selected = true;
            this.redrawCanvas();
        },

        getSelectedRegion: function() {
            for (let i = 0; i < this.regions.length; i++) {
                if(this.regions[i].selected == true) {
                    return this.regions[i];
                }
            }
            return null;
        },

        snapAllRegions: function() {
            for (let i = 0; i < this.regions.length; i++) {
                this.regions[i].snap(this.$refs.canvas.width, this.$refs.canvas.height, this.grid_rows, this.grid_columns);
            }
            this.redrawCanvas();
        },

        redrawCanvas: function () {
            var ctx = this.$refs.canvas.getContext('2d');
            
            //clear the canvas
            ctx.clearRect(0, 0, this.$refs.canvas.width, this.$refs.canvas.height);

            //draw the image if it exists
            if (this.image_loaded) {
                ctx.drawImage(this.image_resource, 0, 0);
            }
            else {
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, this.$refs.canvas.width, this.$refs.canvas.height);
            }
            
            //draw the grid...\
            if (this.grid_enabled) {
                
            
                var cell_width = this.$refs.canvas.width / this.grid_columns;
                var cell_height = this.$refs.canvas.height / this.grid_rows;
                ctx.strokeStyle = 'rgba(0,0,0,0.6)';
                for (var i = 0; i < this.grid_columns; i++) {
                    ctx.beginPath();
                    ctx.moveTo(i * cell_width, 0);
                    ctx.lineWidth = 1;
                    ctx.lineTo(i * cell_width, this.$refs.canvas.height);
                    ctx.stroke();
                    ctx.closePath();
                }
                for (var j = 0; j < this.grid_rows; j++) {
                    ctx.beginPath();
                    ctx.moveTo(0, j * cell_height);
                    ctx.lineWidth = 1;
                    ctx.lineTo(this.$refs.canvas.width, j * cell_height);
                    ctx.stroke();
                    ctx.closePath();
                }
            }

            //draw the regions
            for (var i = 0; i < this.regions.length; i++) {
                this.regions[i].draw(ctx, (i + 1).toString());
            }

        },
        deleteRegion(region) {
            this.regions.splice(this.regions.indexOf(region), 1);
            this.selectNone();
        },
        onCanvasMouseDown: function(event) {
            var canvas = event.target;
            var x = event.pageX - canvas.offsetLeft;
            var y = event.pageY - canvas.offsetTop;


            for (var i = this.regions.length - 1; i >= 0; i--) {
                if (event.which == 1) { //left click
                    if (this.regions[i].selectIfMouseOver({x: x, y: y})){
                        break;
                    }
                } else if (event.which == 3) { // right click
                    if (this.regions[i].selectIfMouseOver({x: x, y: y})){
                        this.deleteRegion(this.getSelectedRegion());
                        break;
                    }
                }
            }

            if (this.getSelectedRegion() == null) {
                if (event.which == 1) { //left click
                    new_region = new Region(x, y, 16, 16, "", 0.8);
                    this.regions.push(new_region);
                    this.selectRegion(new_region);
                    new_region.tool_operation_mode = "scale";
                }
            }
            
            this.redrawCanvas();
        },

        onCanvasMouseMove: function (event) {
            var canvas = event.target;
            var x = event.pageX - canvas.offsetLeft;
            var y = event.pageY - canvas.offsetTop;


            for (var i = 0; i < this.regions.length; i++) {
                this.regions[i].onMouseMove({x: x, y: y}, this.$refs.canvas.width, this.$refs.canvas.height);
            }

            this.redrawCanvas();
            
        },
        onCanvasMouseUp: function(event) {
            var canvas = event.target;
            var x = event.pageX - canvas.offsetLeft;
            var y = event.pageY - canvas.offsetTop;

            for (var i = 0; i < this.regions.length; i++) {
                this.regions[i].onMouseUp({x: x, y: y});
            }
            this.redrawCanvas();
        },

        onCanvasMouseLeave: function(event) {
            for (var i = 0; i < this.regions.length; i++) {
                this.regions[i].onMouseLeave(this.$refs.canvas.width, this.$refs.canvas.height);
            }
        },
        getRatios: function(region){
            return region.getRatios(this.$refs.canvas.width, this.$refs.canvas.height)
        },
        copyText(text) {
            navigator.clipboard.writeText(text);
        }
    },
    computed: {
        nick: function() {
            //returns a random nickname from the list of nicknames in the variable nicknames
            let nicknames = ["DeepDreamDestroyer", "Artificial Artist", "Synthetic Sorcerer", "The IP Bandit", "Hue Hacker", "AInomaly", "Deep Dream Disaster", "The Property Intellectual", "Content Crook, Let Him Cook", "The Canvas Caper", "Cyber Surrealist", "The Trademark Terrorist", "Infringe This", "NeuralNetNinja", "The Photo Copyer", "GANtastic", "Pixel Pirate", "Oops I Stole Your Art :3"]
            return nicknames[Math.floor(Math.random() * nicknames.length)];
        }
    }
});