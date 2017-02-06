var fs          = require('fs');
var gulp        = require('gulp');
var cleanCSS    = require('gulp-clean-css');
var mustache    = require("gulp-mustache");
var mysql       = require("mysql");
var prefix      = require('gulp-autoprefixer');
var rename      = require('gulp-rename');
var htmlmin     = require('gulp-htmlmin');
var sass        = require('gulp-sass');

/* 
* Settings
*/
$opt_htmlmin = {collapseWhitespace:true,removeComments:true}
$opt_mysql   = {
    host: "localhost",
    user: "root",
    password: "root",
    database: "appnexus_data"
}

/* 
* Database Related Tasks
*/
function write_entries(err,rows,settings){
    if(err) throw err;
    var html = "";
    for(let i in rows){
        var id   = rows[i].seller_member_id;
        var name = rows[i].seller_member_name;
        var logo = rows[i].logo_name;
        var url  = rows[i].website_url;
        var file = settings.image_folder;
        if(logo.length > 0){file += logo+'.jpg';}else{file += id+'.jpg';}
        html += 
            `<div class="grid-item">
                <a target="_blank" href="${url}">
                <amp-img src="${file}"
                  width="128"
                  height="128"
                  layout="responsive"></amp-img>
                </a>
            </div>
            `;
    }
    fs.writeFileSync(settings.output_file,html);
}
gulp.task('write_standard_ads',function(){
    var sql = "SELECT * FROM `inventory_all` WHERE `inventory_type` LIKE '%standard%' AND `include`=1 ORDER BY `total_imps` DESC LIMIT 20";
    var con = mysql.createConnection($opt_mysql);
    var settings = {
        image_folder : 'img/menu/inventory/',
        output_file : 'src/partials/html/menu_inventory_standard.html'
    }
    con.connect(function(err){if(err){console.log('Error connecting to Db');return;};console.log('Connection established');});
    con.query(sql,function(err,rows){write_entries(err,rows,settings)});
    con.end(function(err){console.log("DB connection end.");});
});
gulp.task('write_native_ads',function(){
    var sql = "SELECT * FROM `inventory_all` WHERE `inventory_type` LIKE '%native%' AND `include`=1 ORDER BY `total_imps` DESC";
    var con = mysql.createConnection($opt_mysql);
    var settings = {
        image_folder : 'img/menu/inventory/',
        output_file : 'src/partials/html/menu_inventory_native.html'
    }
    con.connect(function(err){if(err){console.log('Error connecting to Db');return;};console.log('Connection established');});
    con.query(sql,function(err,rows){write_entries(err,rows,settings)});
    con.end(function(err){console.log("DB connection end.");});
});
gulp.task('write_video_ads',function(){
    var settings = {
        image_folder : 'img/menu/others/',
        output_file : 'src/partials/html/menu_inventory_video.html'
    }
    var entries = [
        {file_id:'Adapt.tv',url:'http://www.aolplatforms.com/onebyaol/'},
        {file_id:'AerServ',url:'https://www.aerserv.com/'},
        {file_id:'GoogleAdx',url:'https://www.google.com/adx/'},
        {file_id:'LiveRail',url:'https://www.facebook.com/audiencenetwork/'},
        {file_id:'Rubicon',url:'http://rubiconproject.com/'},
        {file_id:'Sharethrough',url:'http://www.sharethrough.com/'},
        {file_id:'SmartRTB',url:'http://www.smartadserver.net/'},
        {file_id:'SpotXchange',url:'https://www.spotxchange.com/'},
        {file_id:'StickyAds',url:'http://www.stickyads.tv/'},
        {file_id:'Teads',url:'http://teads.tv/'},
        {file_id:'Tremor',url:'http://www.tremorvideo.com/'},
        {file_id:'UnrulyX',url:'https://unruly.co/products/#unrulyx'}
    ];
    var html = "";
    for(let i in entries){
        var file = settings.image_folder+entries[i].file_id+'.jpg';
        var url  = entries[i].url;
        html += 
            `<div class="grid-item">
                <a target="_blank" href="${url}">
                <amp-img src="${file}"
                  width="128"
                  height="128"
                  layout="responsive"></amp-img>
                </a>
            </div>
            `;
    }
    fs.writeFileSync(settings.output_file,html);
});
gulp.task('write_audio_ads',function(){
    var settings = {
        image_folder : 'img/menu/others/',
        output_file : 'src/partials/html/menu_inventory_audio.html'
    }
    var entries = [
        {file_id:'Spotify',url:'https://www.spotify.com/'},
        {file_id:'TritonDigital',url:'https://www.tritondigital.com/'},
    ];
    var html = "";
    for(let i in entries){
        var file = settings.image_folder+entries[i].file_id+'.jpg';
        var url  = entries[i].url;
        html += 
            `<div class="grid-item">
                <a target="_blank" href="${url}">
                <amp-img src="${file}"
                  width="128"
                  height="128"
                  layout="responsive"></amp-img>
                </a>
            </div>
            `;
    }
    fs.writeFileSync(settings.output_file,html);
});

/* 
* Parsing Tasks
*/
// Parse scss files from src/scss folder to src/css then update dist state.
gulp.task('apply_scss',function(){
    gulp.src('./src/scss/*.scss')
        .pipe(sass())
        .pipe(prefix())
        .pipe(cleanCSS())
        .pipe(rename(function(path){path.extname = ".min.css";}))
        .pipe(gulp.dest('./src/css'));
    gulp.src('./src/*.mustache')
        .pipe(mustache())
        .pipe(htmlmin($opt_htmlmin))
        .pipe(rename(function(path){path.extname = ".html";}))
        .pipe(gulp.dest('./dist'));
});
// Parse all mustache template files from src root then update dist for changes.
gulp.task('apply_mustache_pages',function(){
    gulp.src('./src/*.mustache')
        .pipe(mustache())
        .pipe(htmlmin($opt_htmlmin))
        .pipe(rename(function(path){path.extname = ".html";}))
        .pipe(gulp.dest('./dist'));
});
// Parse all mustache template files from src/partials then update dist for changes.
gulp.task('apply_mustache_partials',function(){
    gulp.src('./src/partials/*.mustache')
        .pipe(mustache())
        .pipe(rename(function(path){path.extname = ".html";}))
        .pipe(gulp.dest('./src/html'));
    gulp.src('./src/*.mustache')
        .pipe(mustache())
        .pipe(htmlmin($opt_htmlmin))
        .pipe(rename(function(path){path.extname = ".html";}))
        .pipe(gulp.dest('./dist'));
});
gulp.task('watch',function(){
    gulp.watch('./src/scss/*.scss',['apply_scss']);
    gulp.watch('./src/*.mustache',['apply_mustache_pages']);
    gulp.watch('./src/partials/*.mustache',['apply_mustache_partials']);
    gulp.watch('./src/partials/html/*.html',['apply_mustache_partials']);
});
// Default task.
gulp.task('default',['scss-build','mustache-build']);