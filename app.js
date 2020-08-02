//jshint esversion:6

const express = require("express");
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://admin-ryan:Test1234@cluster0.3r8zs.mongodb.net/todolistDB', 
{useNewUrlParser: true, 
  useFindAndModify: false,
  useUnifiedTopology: true
});

const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const Item = mongoose.model('Item', itemsSchema);
const List = mongoose.model('List', listSchema);

const item1 = new Item({
  name: 'Welcome to your to-do list!'
});
const item2 = new Item({
  name: 'Hit the + button to add a new item.'
});
const item3 = new Item({
  name: '<--- Hit this to delet an item.'
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {
  
  Item.find({}, function(err, results){
      if (results.length === 0) {
        Item.insertMany(defaultItems, function(err){
          if (err) {
            console.log(err);
          } else {
            console.log('All documents added to todolistDB');
          }
        });
        res.redirect('/');
      } else {
        res.render("list", {listTitle: 'Today', newListItems: results});
      }
  });

});

app.get('/:customListName', function(req,res){
  var customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, results){
    if (!err){
      if (!results) {
      // Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect('/' + customListName); 
      } else {
      // Show an exsisting list
        res.render('list', {listTitle: results.name, newListItems: results.items});
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  
  const item = new Item({
    name:itemName
  });

  if (listName === 'Today') {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect('/'+ listName);
    });
  }
});
app.post('/delete', function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today'){
    Item.findByIdAndDelete(checkedItemId, function(err){
      if (err) {
        console.log(err);
        res.redirect('/');
      } else {
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err) {
        res.redirect('/' + listName);
      }
    });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfuly");
});
