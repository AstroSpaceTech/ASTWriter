const functions = require('firebase-functions');
const express = require("express");

const YML = require("yaml");
const fs = require("fs");
const path = require("path");
const os = require("os");
const git = require("simple-git");
var rimraf = require("rimraf");

// repo_path = path.join(tmp, new Date().getTime().toString(), "AstroSpaceTech.github.io");
const repo_root = path.join(os.tmpdir(), "AstroSpaceTech.github.io");
const repo_url = "https://github.com/AstroSpaceTech/AstroSpaceTech.github.io.git";
const pusher = {
    "name": "XinYaanZyoy",
    "email": "XinYaanZyoy@gmail.com"
}

var admin = require("firebase-admin");
var serviceAccount = require("./secrets/serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://astwriterapp.firebaseio.com/"
});  

var db = admin.database();
var ref = db.ref();

const app = express();

var logs = [];
const fb_prj_id = "astwriterapp";

function initial(){
    fs.mkdir(repo_root, {recursive: true}, err=>{
        if(err)
        {
            console.log(err);
            logs.push(String(err));
        }
        else{
            console.log(`created ${repo_root}`);
            logs.push(`created ${repo_root}`);
            git(repo_root).raw(["init"], err=>{
                if(err){
                    console.log(err);
                    logs.push(String(err));
                }
                else{
                    console.log(`initiated git at ${repo_root}`);
                    logs.push(`initiated git at ${repo_root}`)
                    git(repo_root).raw(["remote", "add", "origin", repo_url], err=>{
                        if(err){
                            console.log(err);
                            logs.push(String(err));
                        }
                        else{
                            console.log(`added remote ${repo_url}`);
                            logs.push(`added remote ${repo_url}`);
                            git(repo_root).raw(["config", "--global", "user.name", pusher.name], (err)=>{
                                if(err){
                                    console.log(err);
                                    logs.push(String(err));
                                }
                                else{
                                    console.log(`assigned ${pusher.name} as user.name`);
                                    logs.push(`assigned ${pusher.name} as user.name`);
                                    git(repo_root).raw(["config", "--global", "user.email", pusher.email], (err)=>{
                                        if(err){
                                            console.log(err);
                                            logs.push(String(err));
                                        }
                                        else{
                                            console.log(`assigned ${pusher.email} as user.email`);
                                            logs.push(`assigned ${pusher.email} as user.email`);
                                            git(repo_root).raw(["config", "--global", "--unset", "http.proxy"], err=>{
                                                if(err){
                                                    console.log(err);
                                                    logs.push(String(err));
                                                }
                                                else{
                                                    console.log("unsetted global http proxy");
                                                    logs.push("unsetted global http proxy");
                                                    git(repo_root).raw(["config", "--global", "--unset", "https.proxy"], err=>{
                                                        if(err){
                                                            console.log(err);
                                                            logs.push(String(err));
                                                        }
                                                        else{
                                                            console.log("unsetted global https proxy");
                                                            logs.push("unsetted global https proxy");
                                                            git(repo_root).raw(["pull", "origin", "master"], err=>{
                                                                if(err){
                                                                    console.log(err);
                                                                    logs.push(String(err));
                                                                }
                                                                else
                                                                    console.log("pulled from origin master");
                                                                    logs.push("pulled from origin master");
                                                            });
                                                        } 
                                                    });
                                                } 
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });   
}

if(!fs.existsSync(repo_root))
    initial();
else{
    console.log(`repo ${repo_root} already exists!`);
    logs.push(`repo ${repo_root} already exists!`);
    rimraf(repo_root, err=>{
        if(err){
            console.log(String(err))
            logs.push(String(err));
        }
        else{
            console.log(`removed ${repo_root}`)
            logs.push(`removed ${repo_root}`);
            initial();
        }
    });
}

app.get("/server",(req,res)=>{
    res.header("Content-Type",'application/json');
    res.send(JSON.stringify({
        "/tmp/": os.tmpdir(),
        "repo_root": repo_root,
        "repo_path": repo_root,
        "repo_url": repo_url,
        "pusher": pusher,
        "exists_repo_root": fs.existsSync(repo_root),
        "initiated_repo_root_git": fs.existsSync(path.join(repo_root, ".git")),
        "exists_repo_posts": fs.existsSync(path.join(repo_root, "_posts")),
        "logs": logs
    }, null, 4));
});

app.get('/app', (req,res)=>{
    const idToken = req.headers.idtoken;
    var emails = [];
    if(idToken){
        ref.once("value", function(snap) {
            snap.val().authors.forEach(ele=>emails.push(ele.email));
            console.log(emails);
            admin.auth().verifyIdToken(idToken).then(function(decodedToken) {
                console.log(decodedToken.email)
                if(decodedToken.aud === fb_prj_id){
                    if(emails.includes(decodedToken.email)){
                        res.sendFile("views/app.html", {root: __dirname}, err=>{
                            if(err){
                                console.log(String(err))
                                logs.push(String(err));
                            }
                            else{
                                console.log("sent app.html")
                                logs.push("sent app.html");
                            }
                        });
                    }
                    else
                        res.sendFile("views/401.html", {root: __dirname}, err=>{
                            if(err){
                                console.log(String(err))
                                logs.push(String(err));
                            }
                            else{
                                console.log("sent 401.html");
                                logs.push("sent 401.html");
                            }
                        });
                }
                else
                    res.sendFile("views/408.html", {root: __dirname}, err=>{
                        console.log(idToken, decodedToken);
                        if(err){
                            console.log(String(err))
                            logs.push(String(err));
                        }
                        else{
                            console.log("sent a 408.html");
                            logs.push("sent 408.html");
                        }
                    });
            }).catch(function(err) {
                res.sendFile("views/408.html", {root: __dirname}, err=>{
                    console.log(idToken, decodedToken);
                    if(err){
                        console.log(String(err))
                        logs.push(String(err));
                    }
                    else{
                        console.log("sent b 408.html")
                        logs.push("sent 408.html");
                    }
                });
                console.log("Err:",err);
                logs.push("Err:",err);
            });
        });
    }
    else
        res.sendFile("views/404.html", {root: __dirname}, err=>{
            if(err){
                console.log(String(err));
                logs.push(String(err));
            }
            else{
                console.log("sent 408.html");
                logs.push("sent 404.html");
            }
        });
});

app.post("/publish", (req,res)=>{
    const idToken = req.body.idtoken;
    var authors_json = [];
    var names = {};
    var emails = [];
    if(idToken){
        ref.once("value", function(snap) {
            authors_json = snap.val().authors;
            authors_json.forEach(ele => {
                emails.push(ele.email);
                names[ele.email] = ele.name;
            });
            admin.auth().verifyIdToken(idToken).then(function(decodedToken) {
                if(decodedToken.aud === fb_prj_id){
                    if(emails.includes(decodedToken.email)){
                        if(Object.keys(req.body).length === 0 && req.body.constructor === Object){
                            console.log(Error);
                            logs.push(Error);
                            res.send("❌error! Empty post! <");
                        }
                        else{
                            ref.once("value", function(snap){
                                var GH_PAT = snap.val().GH_PAT;
                                if(GH_PAT){
                                    var header = "---\n";
                                    var doc = new YML.Document();
                                    var date = new Date();
                                    var metadata = req.body.metadata;
                                    metadata.layout = "post";
                                    metadata.author = names[decodedToken.email];
                                    metadata.tags = metadata.tags.split(",");
                                    doc.contents = metadata;
                                    var content = header+doc.toString()+header+req.body.content;
                                    fs.writeFile(path.join(repo_root,"_posts",`${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}-${req.body.metadata.title}.md`), content, err=>{
                                        if(err){
                                            console.log(String(err));
                                            logs.push(String(err));
                                            res.send("❌error! writing post!");
                                        }
                                        else{
                                            console.log("✔️successfully posted!");
                                            logs.push("✔️successfully posted!");
                                            res.send("✔️successfully posted! <");
                                        }
                                    });
                                }
                                else{
                                    console.log("❌error! GH_PAT undefined!");
                                    logs.push("❌error! GH_PAT undefined!");
                                    res.send("❌error! GH_PAT undefined! <");
                                }
                            });
                        }
                    }
                    else{
                        console.log("❌error! try SigningIn again!");
                        logs.push("❌error! try SigningIn again!");
                        res.send("❌error! try SigningIn again!");
                    }
                }
                else{
                    console.log("❌error! aud out of scope!");
                    logs.push("❌error! aud out of scope!");
                    res.send("❌error! aud out of scope!");
                }
            }).catch(function(err) {
                console.log(String(err));
                logs.push(String(err));
                res.send(String(err));
            });
        });
    }
    else{
        console.log("❌error! no token provided!");
        logs.push("❌error! no token provided!");
        res.send("❌error! no token provided!");
    }
});

app.get('*', function(req, res){
    res.status(404).sendFile("views/404.html", {root: __dirname}, err=>{
        if(err){
            console.log(String(err));
            logs.push(String(err));
        }
        else{
            console.log("sent 404.html");
            logs.push("sent 404.html");
        }
    });
});

exports.app = functions.https.onRequest(app);

