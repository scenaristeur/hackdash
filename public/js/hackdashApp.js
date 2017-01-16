/*! 
* Hackdash - v0.10.1
* Copyright (c) 2017 Hackdash 
*  
*/ 


(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Hackdash Application
 *
 */

var HackdashRouter = require('./HackdashRouter')
  , LoginView = require("./views/Login")
  , MessageView = require("./views/MessageBox")
  , ModalRegion = require('./views/ModalRegion');

module.exports = function(){

  var app = module.exports = new Backbone.Marionette.Application();

  function initRegions(){
    app.addRegions({
      header: "header",
      main: "#main",
      footer: "footer",
      modals: ModalRegion
    });

    app.showLogin = function(){
      var providers = window.hackdash.providers;

      app.modals.show(new LoginView({
        model: new Backbone.Model({ providers: providers.split(',') })
      }));
    };

    app.showOKMessage = function(opts){
      app.modals.show(new MessageView({
        model: new Backbone.Model(opts)
      }));
    };

    app.setTitle = function(title){
      window.document.title = title + " - Hackdash";
    };
  }

  function initRouter(){
    app.router = new HackdashRouter();
    app.router.on("route", function(/*route, params*/) {
      app.previousURL = Backbone.history.fragment;
    });
    Backbone.history.start({ pushState: true });
  }

  app.addInitializer(initRegions);
  app.addInitializer(initRouter);

  window.hackdash.app = app;
  window.hackdash.app.start();

  // Add navigation for BackboneRouter to all links
  // unless they have attribute "data-bypass"
  $(window.document).on("click", "a:not([data-bypass])", function(evt) {
    var href = { prop: $(this).prop("href"), attr: $(this).attr("href") };
    var root = window.location.protocol + "//" + window.location.host + (app.root || "");

    if (href.prop && href.prop.slice(0, root.length) === root) {
      evt.preventDefault();
      Backbone.history.navigate(href.attr, { trigger: true });
    }
  });

};
},{"./HackdashRouter":2,"./views/Login":71,"./views/MessageBox":72,"./views/ModalRegion":73}],2:[function(require,module,exports){
/*
 * Hackdash Router
 */

var Dashboard = require("./models/Dashboard")
  , Project = require("./models/Project")
  , Projects = require("./models/Projects")
  , Collection = require("./models/Collection")
  , Profile = require("./models/Profile")

  , Header = require("./views/Header")
  , Footer = require("./views/Footer")

  , HomeLayout = require("./views/Home")
  , ProfileView = require("./views/Profile")
  , ProjectFullView = require("./views/Project/Full")
  , ProjectEditView = require("./views/Project/Edit")
  , DashboardView = require("./views/Dashboard")
  , CollectionView = require("./views/Collection")
  ;

module.exports = Backbone.Marionette.AppRouter.extend({

  routes : {
      "" : "showHome"
    , "login" : "showHome"

    // LANDING
    , "dashboards" : "showLandingDashboards"
    , "projects" : "showLandingProjects"
    , "users" : "showLandingUsers"
    , "collections" : "showLandingCollections"

    // APP
    , "dashboards/:dash": "showDashboard"
    , "dashboards/:dash/create": "showProjectCreate"

    , "projects/:pid/edit" : "showProjectEdit"
    , "projects/:pid" : "showProjectFull"

    , "collections/:cid" : "showCollection"

    , "users/profile": "showProfile"
    , "users/:user_id" : "showProfile"

  },

  onRoute: function(name, path){
    window._gaq.push(['_trackPageview', path]);
  },

  showHome: function(){
    this.homeView = new HomeLayout();
    var app = window.hackdash.app;
    app.type = "landing";

    app.main.show(this.homeView);
  },

  getSearchQuery: function(){
    var query = hackdash.getQueryVariable("q");
    var fetchData = {};
    if (query && query.length > 0){
      fetchData = { data: $.param({ q: query }) };
    }

    return fetchData;
  },

  showHomeSection: function(section){
    var app = window.hackdash.app;
    app.type = "landing";

    if (!this.homeView){
      var main = hackdash.app.main;
      this.homeView = new HomeLayout({
        section: section
      });

      main.show(this.homeView);
    }

    this.homeView.setSection(section);
  },

  showLandingDashboards: function(){
    this.showHomeSection("dashboards");
  },

  showLandingProjects: function(){
    this.showHomeSection("projects");
  },

  showLandingUsers: function(){
    this.showHomeSection("users");
  },

  showLandingCollections: function(){
    this.showHomeSection("collections");
  },

  showDashboard: function(dash) {

    var app = window.hackdash.app;
    app.type = "dashboard";

    app.dashboard = new Dashboard();
    app.projects = new Projects();

    if (dash){
      app.dashboard.set('domain', dash);
      app.projects.domain = dash;
    }

    app.dashboard.fetch().done(function(){
      app.projects.fetch({}, { parse: true })
        .done(function(){
          app.projects.buildShowcase(app.dashboard.get("showcase"));

          app.header.show(new Header({
            model: app.dashboard,
            collection: app.projects
          }));

          app.main.show(new DashboardView({
            model: app.dashboard
          }));

          app.footer.show(new Footer({
            model: app.dashboard
          }));

          app.setTitle(app.dashboard.get('title') || app.dashboard.get('domain'));

        });
    });

  },

  showProjectCreate: function(dashboard){

    var app = window.hackdash.app;
    app.type = "project";

    app.project = new Project({
      domain: dashboard
    });

    app.header.show(new Header());

    app.main.show(new ProjectEditView({
      model: app.project
    }));

    app.footer.show(new Footer({
      model: app.dashboard
    }));

    app.setTitle('Create a project');
  },

  showProjectEdit: function(pid){

    var app = window.hackdash.app;
    app.type = "project";

    app.project = new Project({ _id: pid });

    app.header.show(new Header());

    app.project.fetch().done(function(){

      app.main.show(new ProjectEditView({
        model: app.project
      }));

      app.setTitle('Edit project');
    });

    app.footer.show(new Footer({
      model: app.dashboard
    }));
  },

  showProjectFull: function(pid){

    var app = window.hackdash.app;
    app.type = "project";

    app.project = new Project({ _id: pid });

    app.project.fetch().done(function(){

      app.header.show(new Header());

      app.main.show(new ProjectFullView({
        model: app.project
      }));

      app.setTitle(app.project.get('title') || 'Project');
    });

    app.footer.show(new Footer({
      model: app.dashboard
    }));
  },

  showCollection: function(collectionId) {

    var app = window.hackdash.app;
    app.type = "collection";

    app.collection = new Collection({ _id: collectionId });

    app.collection
      .fetch({ parse: true })
      .done(function(){

        app.header.show(new Header({
          model: app.collection
        }));

        app.main.show(new CollectionView({
          model: app.collection
        }));

        app.footer.show(new Footer({
          model: app.dashboard
        }));

        app.setTitle(app.collection.get('title') || 'Collection');
      });
  },

  showProfile: function(userId) {

    var app = window.hackdash.app;
    app.type = "profile";

    if (userId && userId.indexOf('from') >= 0){
      userId = null;
    }

    if (!userId){
      if (hackdash.user){
        userId = hackdash.user._id;
      }
      else {
        window.location = "/";
      }
    }

    app.profile = new Profile({
      _id: userId
    });

    app.header.show(new Header());

    app.profile.fetch({ parse: true }).done(function(){

      app.main.show(new ProfileView({
        model: app.profile
      }));

      app.footer.show(new Footer());

      app.setTitle(app.profile.get('name') || 'Profile');
    });

  },

});

},{"./models/Collection":12,"./models/Dashboard":15,"./models/Profile":17,"./models/Project":18,"./models/Projects":19,"./views/Collection":24,"./views/Dashboard":34,"./views/Footer":42,"./views/Header":45,"./views/Home":60,"./views/Profile":78,"./views/Project/Edit":85,"./views/Project/Full":86}],3:[function(require,module,exports){

module.exports = function(){

  window.hackdash = window.hackdash || {};

  window.hackdash.getQueryVariable = function(variable){
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
      var pair = vars[i].split("=");
      if(pair[0] === variable){return decodeURI(pair[1]);}
    }
    return(false);
  };

  if ($.fn.editable){
    // Set global mode for InlineEditor (X-Editable)
    $.fn.editable.defaults.mode = 'inline';
  }

  hackdash.statuses = [
    'brainstorming',
    'researching',
    'prototyping',
    'wireframing',
    'building',
    'releasing'
  ];

  var lan =
    window.navigator.languages ?
      window.navigator.languages[0] :
      (window.navigator.language || window.navigator.userLanguage || 'en-US');

  var locales = require('./locale');
  locales.setLocale(lan);

  window.__ = hackdash.i18n = locales.__;

  // Init Helpers
  require('./helpers/handlebars');
  require('./helpers/backboneOverrides');

  Placeholders.init({ live: true, hideOnFocus: true });

  Dropzone.autoDiscover = false;

  window.hackdash.apiURL = "/api/v2";
  window._gaq = window._gaq || [];

  if (window.hackdash.fbAppId){
    $.getScript('//connect.facebook.net/en_US/sdk.js', function(){
      window.FB.init({
        appId: window.hackdash.fbAppId,
        version: 'v2.3'
      });
    });
  }

};

},{"./helpers/backboneOverrides":4,"./helpers/handlebars":5,"./locale":9}],4:[function(require,module,exports){
/*
 * Backbone Global Overrides
 *
 */

// Override Backbone.sync to use the PUT HTTP method for PATCH requests
//  when doing Model#save({...}, { patch: true });

var originalSync = Backbone.sync;

Backbone.sync = function(method, model, options) {
  if (method === 'patch') {
    options.type = 'PUT';
  }

  return originalSync(method, model, options);
};

},{}],5:[function(require,module,exports){
/**
 * HELPER: Handlebars Template Helpers
 *
 */

var Handlebars = require("hbsfy/runtime");

Handlebars.registerHelper('embedCode', function() {
  var embedUrl = window.location.protocol + "//" + window.location.host;
  var template = _.template('<iframe src="<%= embedUrl %>" width="100%" height="500" frameborder="0" allowtransparency="true" title="Hackdash"></iframe>');

  return template({
    embedUrl: embedUrl
  });
});

Handlebars.registerHelper('firstUpper', function(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
});

Handlebars.registerHelper('firstLetter', function(text) {
  if (text){
    return text.charAt(0);
  }
  return "";
});

Handlebars.registerHelper('markdown', function(md) {
  if (md){
    return markdown.toHTML(md);
  }
  return "";
});

Handlebars.registerHelper('discourseUrl', function() {
  return window.hackdash.discourseUrl;
});

Handlebars.registerHelper('disqus_shortname', function() {
  return window.hackdash.disqus_shortname;
});

Handlebars.registerHelper('user', function(prop) {
  if (window.hackdash.user){
    return window.hackdash.user[prop];
  }
});

Handlebars.registerHelper('isLoggedIn', function(options) {
  if (window.hackdash.user){
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('isDashboardView', function(options) {
  if (window.hackdash.app.type === "dashboard"){
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('isLandingView', function(options) {
  if (window.hackdash.app.type === "landing"){
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('isEmbed', function(options) {
  if (window.hackdash.app.source === "embed"){
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('timeAgo', function(date) {
  if (date && moment(date).isValid()) {
    return moment(date).fromNow();
  }

  return "-";
});

Handlebars.registerHelper('formatDate', function(date) {
  if (date && moment(date).isValid()) {
    return moment(date).format("DD/MM/YYYY HH:mm");
  }

  return "-";
});

Handlebars.registerHelper('formatDateText', function(date) {
  if (date && moment(date).isValid()) {
    return moment(date).format("DD MMM YYYY, HH:mm");
  }

  return "";
});

Handlebars.registerHelper('formatDateTime', function(date) {
  if (date && moment(date).isValid()) {
    return moment(date).format("HH:mm");
  }

  return "";
});

Handlebars.registerHelper('timeFromSeconds', function(seconds) {

  function format(val){
    return (val < 10) ? "0" + val : val;
  }

  if (seconds && seconds > 0){

    var t = moment.duration(seconds * 1000),
      h = format(t.hours()),
      m = format(t.minutes()),
      s = format(t.seconds());

    return h + ":" + m + ":" + s;
  }

  return "-";
});

Handlebars.registerHelper('getProfileImage', function(user) {

  if (!user){
    return '';
  }

  var img = new window.Image();

  $(img)
    .load(function () { })
    .error(function () {
      $('.' + this.id).attr('src', '//avatars.io/' + user.provider + '/' + user.username);
    })
    .prop({
      id: 'pic-' + user._id,
      src: user.picture,
      'data-id': user._id,
      title: user.name,
      class: 'avatar tooltips pic-' + user._id,
      rel: 'tooltip'
    });

  return new Handlebars.SafeString(img.outerHTML);
});

function getProfileImageHex(user) {

  if (!user){
    return '';
  }

  var img = new window.Image();

  $(img)
    .load(function () { })
    .error(function () {
      $('.' + this.id)
        .css('background-image', 'url(//avatars.io/' + user.provider + '/' + user.username + ')');
    })
    .prop({
      src: user.picture,
      id: 'pic-' + user._id
    });

  var div = $('<div>')
    .prop({
      'data-id': user._id,
      title: user.name,
      class: 'avatar tooltips pic-' + user._id,
      rel: 'tooltip'
    })
    .css('background-image', 'url(' + user.picture + ')')
    .addClass('hexagon');

  div.append('<div class="hex-top"></div><div class="hex-bottom"></div>');

  return new Handlebars.SafeString(div[0].outerHTML);
}

Handlebars.registerHelper('getProfileImageHex', getProfileImageHex);

Handlebars.registerHelper('getMyProfileImageHex', function() {
  return getProfileImageHex(window.hackdash.user);
});

Handlebars.registerHelper('__', function(key) {
  return window.__(key);
});

Handlebars.registerHelper('each_upto', function(ary, max, options) {
    if(!ary || ary.length === 0) {
      return options.inverse(this);
    }

    var result = [];
    for(var i = 0; i < max && i < ary.length; ++i) {
      result.push(options.fn(ary[i]));
    }

    return result.join('');
});

Handlebars.registerHelper('each_upto_rnd', function(ary, max, options) {
    if(!ary || ary.length === 0) {
      return options.inverse(this);
    }

    var picks = [];
    function pick(max){
      var rnd = Math.floor(Math.random() * max);
      if (picks.indexOf(rnd) === -1) {
        picks.push(rnd);
        return rnd;
      }
      return pick(max);
    }

    var result = [];
    for(var i = 0; i < max && i < ary.length; ++i) {
      result.push( options.fn(ary[pick(ary.length)]) );
    }

    return result.join('');
});

},{"hbsfy/runtime":103}],6:[function(require,module,exports){
jQuery(function() {
  require('./Initializer')();
  window.hackdash.startApp = require('./HackdashApp');
});
},{"./HackdashApp":1,"./Initializer":3}],7:[function(require,module,exports){
/*eslint-disable */
module.exports = {
  "code": "en-US",
  "time_format": "HH:mm",
  "date_locale": "en",
  "date_format": "MM\/DD\/YYYY",
  "datetime_format": "MM\/DD\/YYYY HH:mm",
  "colloquial_date_format": "ddd Do MMMM YYYY",


/* Home Directory */

/* home.hbs */

  "Dashboards": "Dashboards",
  "create now": "create now",
  "ERROR":"ERROR",
  "Ideas for a": "Ideas for a",
  "hackathon":"hackathon",
  "Collections":"Collections",
  "Projects":"Projects",
  "People":"People",
  "team":"team",
  "partners":"partners",
  "The HackDash was born":"The HackDash was born by accident and by a need. We were looking for a platform to track ideas through hackathons in the line to the <a href=\"http://mediaparty.info/\" data-bypass=\"true\" target=\"__blank\">Hacks/Hackers Media Party</a> organized by <a href=\"https://twitter.com/HacksHackersBA\" data-bypass=\"true\" target=\"__blank\">@HacksHackersBA</a> where hackers and journalists share ideas. We spread the need through Twitter and that was the context of the HackDash born. <a href=\"https://twitter.com/blejman\" data-bypass=\"true\" target=\"__blank\">@blejman</a> had an idea and <a href=\"https://twitter.com/dzajdband\" data-bypass=\"true\" target=\"__blank\">@dzajdband</a> was interested in implement that idea. So we started building the app hoping we can get to the Buenos Aires Media Party with something that doesn't suck. The Media Party Hackathon day came followed by a grateful surprise. Not only the people liked the HackDash implementation but a couple of coders added the improvement of the HackDash as a Hackaton project. After the Media Party we realized that this small app was filling a real need. Three years later, the dashboard is becoming an standard to track innovative ideas around the world.<p><a class=\"up-button\">Create your own dashboard</a>, be part of a global community.</p>",

/* collection.hbs */

/* counts.hbs */

"dashboards":"dashboards",
"projects":"projects",
"registered users":"registered users",
"collections":"collections",
"released projects":"released projects",

/* footer.hbs */

"up":"up",

/* search.hbs */

"Inform Progress to community.":"Inform Progress to community.",
"Upload your project to the platform.":"Upload your project to the platform.",
"find it":"find it",
"Add Collaborators to your projects.":"Add Collaborators to your projects.",
"Share your app to the world.":"Share your app to the world.",

/* tabContent.hbs */

"HEAD":"HEAD",

/* Collections directory */

/* list.hbs */

"My Collections: adding":"My Collections: adding",

/* listItem.hbs */

"View":"View",

/* Dashboard directory */

/* addAdmin.hbs */

"Warning! you will NOT":"Warning! you will NOT be able to delete this dashboard if you add an admin!",
"type name or username":"type name or username",
"cancel":"cancel",

/* index.hbs */

"Open dashboard website":"Open dashboard website",
"Share this Dashboard":"Share this Dashboard",
"Create Project":"Create Project",

/* share.hbs */

"embed this dashboard":"embed this dashboard",
"Slider":"Slider",
"ANY STATUS":"ANY STATUS",
"Add this dashboard to your website by coping this code below":"Add this dashboard to your website by coping this code below",
"By Name":"By Name",
"By Date":"By Date",
"Showcase":"Showcase",
"Share Link":"Share Link",
"Preview":"Preview",
"embedded_code":"The embedded code will show exactly what's below",


/* users.hbs */

"Add admins":"Add admins",


/* Footer directory */

/* footer.hbs */

"Export .CSV File":"Export .CSV File",
"Open":"Open",
"Close":"Close",
"Dashboard Status":"Dashboard Status",
"off":"off",

/* Header directory */

/* header.hbs */

"Log out":"Log out",
"Log in":"Log in",

/* Profile directory */

/* card.hbs */

"[ Log in to reveal e-mail ]":"[ Log in to reveal e-mail ]",

/* cardEdit.hbs */

"Edit Your Profile":"Edit Your Profile",
"all fields required":"all fields required",
"email only visible for logged in users":"email only visible for logged in users",
"about_you":"Some about you",
"saving...":"saving...",
"Save profile":"Save profile",
"Profile saved, going back to business ...":"Profile saved, going back to business ...",

/* listItem.hbs */

"Remove":"Remove",

/* profile.hbs */

"Contributions":"Contributions",
"following":"Following",

/* Project directory */

/* card.hbs */

"Join":"Join",
"Follow":"Follow",
"Leave":"Leave",
"Unfollow":"Unfollow",
"Demo":"Demo",

/* edit.hbs */

"Project Title":"Project Title",
"Import Project":"Import Project",
"GitHub":"GitHub",
"LOADING":"LOADING",
"import":"import",
"Tags":"Tags ( comma separated values )",
"Project URL Demo":"Project URL Demo",
"Save":"Save",
"Cancel":"Cancel",

/* full.hbs */

"leaving...":"leaving...",
"joining...":"joining...",
"unfollowing...":"unfollowing...",
"following...":"following...",
"Share this Project":"Share this Project",
"Managed by":"Managed by",
"Contributors":"Contributors",
"Edit":"Edit",


/* share.hbs */

"embed this project":"embed this project",
"Add this project to your website by coping this code below":"Add this project to your website by coping this code below",


/* templates directory */

"Access with":"Access with",
"embed/insert":"embed/insert",


/* ----------------------- js files ------------------------ */

/* Sharer.js */

"Hacking at":"Hacking at",

/* Collection directory */

/* Collection.js */

"Collection of Hackathons Title":"Collection of Hackathons Title",
"brief description of this collection of hackathons":"brief description of this collection of hackathons",

/* List.js */

" has been added to ":" has been added to ",
" has been removed from ":" has been removed from ",

/* Dashboard directory */

/* Dashboard.js */

"Hackathon Title":"Hackathon Title",
"brief description of this hackathon":"brief description of this hackathon",
"url to hackathon site":"url to hackathon site",

/* Share.js */

"Description":"Description",
"Hackdash Logo":"Hackdash Logo",
"Progress":"Progress",
"Action Bar":"Action Bar",

/* Footer directory */

/* index.js */

"This Dashboard is open: click to close":"This Dashboard is open: click to close",
"This Dashboard is closed: click to reopen":"This Dashboard is closed: click to reopen",
"turned_off":"apagado",
"Edit Showcase":"Edit Showcase",
"Save Showcase":"Save Showcase",

/* Header directory */

/* index.js */


"Enter your keywords":"Enter your keywords",

/* Home directory */
/* index.js */

"5 to 10 chars, no spaces or special":"5 to 10 chars, no spaces or special",
"Sorry, that one is in use. Try another one.":"Sorry, that one is in use. Try another one.",

/* Profile directory */
/* CardEdit.js */

"Name is required":"Name is required",
"Email is required":"Email is required",
"Invalid Email":"Invalid Email",

/* ListItem.js */

"Only the Owner can remove this Dashboard.":"Only the Owner can remove this Dashboard.",
"Only Dashboards with ONE admin can be removed.":"Only Dashboards with ONE admin can be removed.",
"Only Dashboards without Projects can be removed.":"Only Dashboards without Projects can be removed.",
"This action will remove Dashboard ":"This action will remove Dashboard ",
". Are you sure?":". Are you sure?",
"cannot_remove_dashboard": "Cannot Remove {1} dashboard",

/* Projects directory */
/* Edit.js */

"Title is required":"Title is required",
"Description is required":"Description is required",
"Drop Image Here":"Drop Image Here",
"File is too big, 500 Kb is the max":"File is too big, 500 Kb is the max",
"Only jpg, png and gif are allowed":"Only jpg, png and gif are allowed",

/* Full.js */

"This project is going to be deleted. Are you sure?":"This project is going to be deleted. Are you sure?",

/* Share.js */

"Picture":"Picture",
"Title":"Title",

};

},{}],8:[function(require,module,exports){
/*eslint-disable */
module.exports = {
  "code": "es-ES",
  "time_format": "HH:mm",
  "date_locale": "es",
  "date_format": "DD\/MM\/YYYY",
  "datetime_format": "DD\/MM\/YYYY HH:mm",
  "colloquial_date_format": "ddd Do MMMM YYYY",


  /* Home Directory */

/* home.hbs */

 
  "dashboard name (5-10 chars)":"nombre del tablero (corto)",
  "Dashboards": "Tableros",
  "create now": "crear ahora",
  "ERROR":"ERROR",
  "Ideas for a": "Ideas para una",
  "hackathon":"hackatón",
  "Collections":"Colecciones",
  "Projects":"Proyectos",
  "People":"Personas",
  "team":"equipo",
  "partners":"socios",
  "The HackDash was born":"HackDash nació por accidente y por necesidad. Estábamos buscando una plataforma para hacer seguimiento de ideas durante los hackatones en la línea de <a href=\"http://mediaparty.info/\" data-bypass=\"true\" target=\"__blank\">Hacks/Hackers Media Party</a> organizado por <a href=\"https://twitter.com/HacksHackersBA\" data-bypass=\"true\" target=\"__blank\">@HacksHackersBA</a> en la que hackers y periodistas comparten ideas. Corrimos la voz de nuestra necesidad por Twitter y ese fue el contexto en el que nació HackDash. <a href=\"https://twitter.com/blejman\" data-bypass=\"true\" target=\"__blank\">@blejman</a> tuvo una idea y a <a href=\"https://twitter.com/dzajdband\" data-bypass=\"true\" target=\"__blank\">@dzajdband</a> le interesó implementar esa idea. Así que empezamos a crear la aplicación esperando llegar al Buenos Aires Media Party con algo que no fuera horrible. El día del hackatón de Media Party llegó acompañado de una grata sorpresa: No solamente HackDash le gustó a la gente, sino que también algunos programadores agregaron la mejora de HackDash como su proyecto de Hackatón. Después del Media Party nos dimos cuenta de que esta pequeña aplicación estaba cubriendo una necesidad real. Tres años después, el tablero se está convirtiendo en un estándar para hacer seguimiento de ideas innovadores alrededor del mundo.<p><a class=\"up-button\">Creá tu propio tablero</a>, sé parte de una comunidad global.</p>",

/* collection.hbs */

/* counts.hbs */

"dashboards":"tableros",
"projects":"proyectos",
"registered users":"usuarios registrados",
"collections":"colectciones",
"released projects":"proyectos lanzados",

/* footer.hbs */

"up":"subir",

/* search.hbs */

"enter keywords": "Palabras clave",
"Inform Progress to community.":"Informa el progreso a la comunidad.",
"Upload your project to the platform.":"Sube tu proyecto a la plataforma.",
"find it":"encuéntralo",
"Add Collaborators to your projects.":"Agrega colaboradores a tu proyecto.",
"Share your app to the world.":"Comparte tu aplicación con el mundo.",

/* tabContent.hbs */

"HEAD":"ENCABEZADO",

/* Collections directory */

/* list.hbs */

"My Collections: adding":"Mis colecciones: agregando",

/* listItem.hbs */

"View":"Ver",

/* Dashboard directory */

/* addAdmin.hbs */

"Warning! you will NOT":"¡Atención! ¡NO podrás eliminar este tablero si agregas un administrador!",
"type name or username":"escribe nombre o nombre de usuario",
"cancel":"cancelar",

/* index.hbs */

"Open dashboard website":"Abrir el sitio del tablero",
"Share this Dashboard":"Compartir este tablero",
"Create Project":"Crear proyecto",

/* share.hbs */

"embed this dashboard":"insertar este tablero",
"Slider":"Slider",
"ANY STATUS":"CUALQUIER ESTADO",
"Add this dashboard to your website by coping this code below":"Agrega este tablero a tu sitio web copiando el código de abajo",
"By Name":"Por nombre",
"By Date":"Por fecha",
"Showcase":"Galería",
"Share Link":"Enlace para compartir",
"Preview":"Previsualización",
"embedded_code":"El código de inserción mostrará exactamente lo que está abajo",


/* users.hbs */

"Add admins":"Agregar administradores",


/* Footer directory */

/* footer.hbs */

"Export .CSV File":"Exportar archivo .CSV",
"Open":"Abrir",
"Close":"Cerrar",
"Dashboard Status":"Estado del tablero",
"off":"apagar",

/* Header directory */

/* header.hbs */

"Log out":"Salir",
"Log in":"Ingresar",

/* Profile directory */

/* card.hbs */

"[ Log in to reveal e-mail ]":"[ Ingresa para revelar el correo ]",

/* cardEdit.hbs */

"Edit Your Profile":"Edita tu perfil",
"all fields required":"todos los campos obligatorios",
"email only visible for logged in users":"correo sólo visible para usuarios ingresados",
"about_you":"Algo sobre tí",
"saving...":"guardando...",
"Save profile":"Guardar perfil",
"Profile saved, going back to business ...":"Perfil guardado, volviendo...",

/* listItem.hbs */

"Remove":"Eliminar",

/* profile.hbs */

"Contributions":"Colaboraciones",
"following":"Siguiendo",

/* Project directory */

/* card.hbs */

"Join":"Unirse",
"Follow":"Seguir",
"Leave":"Abandonar",
"Unfollow":"Dejar de seguir",
"Demo":"Demo",

/* edit.hbs */

"Project Title":"Título del proyecto",
"Import Project":"Importar proyecto",
"GitHub":"GitHub",
"LOADING":"CARGANDO",
"import":"importar",
"Tags":"Etiquetas (valores separados por comas)",
"Project URL Demo":"URL de demo del proyecto",
"Save":"Guardar",
"Cancel":"Cancelar",

/* full.hbs */

"leaving...":"abandondando...",
"joining...":"uniéndose...",
"unfollowing...":"dejando de seguir...",
"following...":"siguiendo...",
"Share this Project":"Comparte este proyecto",
"Managed by":"Administrado por",
"Contributors":"Colaboradores",
"Edit":"Editar",


/* share.hbs */

"embed this project":"inserta este proyecto",
"Add this project to your website by coping this code below":"Agrega este proyecto a tu sitio copiando el código de abajo",


/* templates directory */

"Access with":"Acceder con",
"embed/insert":"insertar",


/* ----------------------- js files ------------------------ */

/* Sharer.js */

"Hacking at":"Hackeando en",

/* Collection directory */

/* Collection.js */

"Collection of Hackathons Title":"Título de la colección de hackatones",
"brief description of this collection of hackathons":"breve descripción de esta colección de hackatones",

/* List.js */

" has been added to ":" ha sido agregado a ",
" has been removed from ":" ha sido eliminado de ",

/* Dashboard directory */

/* Dashboard.js */

"Hackathon Title":"Título de Hackatón",
"brief description of this hackathon":"breve descripción de esta hackatón",
"url to hackathon site":"url del sitio de la hackatón",

/* Share.js */

"Title":"Título",
"Description":"Descripción",
"Hackdash Logo":"Logo de Hackdash",
"Progress":"Progreso",
"Action Bar":"Barra de Acciones",

/* Footer directory */

/* index.js */

"This Dashboard is open: click to close":"Este tablero está abierto: clic para cerrar",
"This Dashboard is closed: click to reopen":"Este tablero está cerrado: clic para reabrir",
"turned_off":"apagado",
"Edit Showcase":"Editar Galería",
"Save Showcase":"Guardar Galería",

/* Header directory */

/* index.js */


"Enter your keywords":"Ingresá las palabras clave",

/* Home directory */
/* index.js */

"5 to 10 chars, no spaces or special":"5 a 10 caracteres, sin espacios o caracteres especiales",
"Sorry, that one is in use. Try another one.":"Perdón, ya está en uso. Prueba otro.",

/* Profile directory */
/* CardEdit.js */

"Name is required":"El nombre es requerido",
"Email is required":"El correo es requerido",
"Invalid Email":"Correo inválido",

/* ListItem.js */

"Only the Owner can remove this Dashboard.":"Sólo el dueño puede eliminar este tablero.",
"Only Dashboards with ONE admin can be removed.":"Sólo tableros con UN admin pueden ser eliminador",
"Only Dashboards without Projects can be removed.":"Sólo tableros sin proyectos pueden ser eliminados.",
"This action will remove Dashboard ":"Esta acción eliminará el Tablero ",
". Are you sure?":". ¿Estás seguro?",
"cannot_remove_dashboard": "No se puede eliminar el tablero {1}",

/* Projects directory */
/* Edit.js */

"Title is required":"El título es requerido",
"Description is required":"La descripción es requerida",
"Drop Image Here":"Suelta la imagen aquí",
"File is too big, 500 Kb is the max":"El archivo es muy grande, 500 Kb es el máximo",
"Only jpg, png and gif are allowed":"Sólo se permiten jpg, png y gif",

/* Full.js */

"This project is going to be deleted. Are you sure?":"Este proyecto será eliminado. ¿Estás seguro?",

/* Share.js */

"Picture":"Imagen",


};

},{}],9:[function(require,module,exports){
/*eslint no-console:0*/
var locales = {
  en: require('./en'),
  es: require('./es')
};

var current = locales.en;
var _lan = 'en';

module.exports = {

  setLocale: function(lan) {
    //console.log(`i18n: setting Language [${lan}]`);
    if (!locales.hasOwnProperty(lan)){

      if (lan.indexOf('-') > -1 || lan.indexOf('_') > -1){
        var parsed = lan.replace('-', '$').replace('_', '$');
        var newLan = parsed.split('$')[0];

        if (newLan && locales.hasOwnProperty(newLan)){
          lan = newLan;
        }
        else {
          var tr = 'i18n: Could not resolve Language from [${lan}] or language [${newLan}] not found';
          console.warn(tr.replace('${lan}', lan).replace('${newLan}', newLan));
          return;
        }
      }
      else {
        console.warn('i18n: Language [${lan}] not found'.replace('${lan}', lan));
        return;
      }
    }

    _lan = lan;
    current = locales[lan];
  },

  locales: function() {
    return current;
  },

  __: function() {
    var key = arguments[0];
    var params = Array.prototype.slice.call(arguments).slice(1);

    var phrase = current[key];

    if (!phrase){
      if (locales.en.hasOwnProperty(key)){
        phrase = locales.en[key];
        console.warn(
          'i18n: Key [${key}] not found for language [${_lan}]'.replace('${key}', key).replace('${_lan}', _lan));
      }
      else {
        phrase = key;
        console.error('i18n: Key [${key}] not found'.replace('${key}', key));
      }
    }

    return params.reduce(function(str, p, i) {
      return str.replace('{'+ (i+1) +'}', p);
    }, phrase);
  }

};

},{"./en":7,"./es":8}],10:[function(require,module,exports){
/**
 * Collection: Administrators of a Dashboard
 *
 */

var
  Users = require('./Users'),
  User = require('./User');

module.exports = Users.extend({

  model: User,
  idAttribute: "_id",

  url: function(){
    return hackdash.apiURL + '/' + this.domain + '/admins';
  },

  addAdmin: function(userId){
    $.ajax({
      url: this.url() + '/' + userId,
      type: "POST",
      context: this
    }).done(function(user){
      this.add(user);
    });
  },

});


},{"./User":21,"./Users":22}],11:[function(require,module,exports){

module.exports = Backbone.Collection.extend({

  // when called FETCH triggers 'fetch' event.
  // That way can be set loading state on components.

  fetch: function(options) {
    this.trigger('fetch', this, options);
    return Backbone.Collection.prototype.fetch.call(this, options);
  }

});
},{}],12:[function(require,module,exports){
/**
 * MODEL: Collection (a group of Dashboards)
 *
 */

var Dashboards = require('./Dashboards');

module.exports = Backbone.Model.extend({

  idAttribute: "_id",

  urlRoot: function(){
    return hackdash.apiURL + '/collections'; 
  },

  parse: function(response){
    response.dashboards = new Dashboards(response.dashboards || []);
    return response;
  },

  addDashboard: function(dashId){
    $.ajax({
      url: this.url() + '/dashboards/' + dashId,
      type: "POST",
      context: this
    });

    this.get("dashboards").add({ _id: dashId });
  },

  removeDashboard: function(dashId){
    $.ajax({
      url: this.url() + '/dashboards/' + dashId,
      type: "DELETE",
      context: this
    });

    var result = this.get("dashboards").where({ _id: dashId});
    if (result.length > 0){
      this.get("dashboards").remove(result[0]);
    }
  },

});


},{"./Dashboards":16}],13:[function(require,module,exports){
/**
 * Collection: Collections (group of Dashboards)
 *
 */

var
  Collection = require('./Collection'),
  BaseCollection = require('./BaseCollection');

module.exports = BaseCollection.extend({

  model: Collection,

  idAttribute: "_id",

  url: function(){
    return hackdash.apiURL + '/collections';
  },

  parse: function(response){
    var whiteList = [];

    response.forEach(function(coll){
      if (coll.title && coll.dashboards.length > 0){
        whiteList.push(coll);
      }
    });

    return whiteList;
  },

  getMines: function(){
    $.ajax({
      url: this.url() + '/own',
      context: this
    }).done(function(collections){
      this.reset(collections, { parse: true });
    });
  }

});


},{"./BaseCollection":11,"./Collection":12}],14:[function(require,module,exports){

module.exports = Backbone.Model.extend({

  defaults: {
    dashboards: 0,
    projects: 0,
    users: 0,
    collections: 0,
    releases: 0
  },

  urlRoot: '/counts',

});

},{}],15:[function(require,module,exports){
/**
 * MODEL: Project
 *
 */

var Admins = require("./Admins");

module.exports = Backbone.Model.extend({

  defaults: {
    admins: null
  },

  urlRoot: function(){
    if (this.get('domain')){
      return hackdash.apiURL + '/dashboards';
    }
    else {
      throw new Error('Unkonw Dashboard domain name');
    }
  },

  idAttribute: "domain",

  initialize: function(){
    this.set("admins", new Admins());
    this.on('change:domain', this.setAdminDomains.bind(this));
    this.setAdminDomains();
  },

  setAdminDomains: function(){
    var admins = this.get("admins");
    admins.domain = this.get('domain');
    this.set("admins", admins);
  },

  isAdmin: function(){
    var user = hackdash.user;
    return user && user.admin_in.indexOf(this.get('domain')) >= 0 || false;
  },

  isOwner: function(){
    var user = hackdash.user;
    var owner = this.get('owner');
    owner = (owner && owner._id) || owner;

    return (user && user._id === owner) || false;
  },

}, {

  isAdmin: function(dashboard){
    var user = hackdash.user;
    return user && user.admin_in.indexOf(dashboard.get('domain')) >= 0 || false;
  },

  isOwner: function(dashboard){
    var user = hackdash.user;
    var owner = dashboard.get('owner');
    owner = (owner && owner._id) || owner;

    return (user && user._id === owner) || false;
  }

});


},{"./Admins":10}],16:[function(require,module,exports){
/**
 * MODEL: Dashboards
 *
 */

var BaseCollection = require('./BaseCollection');

module.exports = BaseCollection.extend({

  url: function(){
    return hackdash.apiURL + "/dashboards"; 
  },

  idAttribute: "_id", 

});


},{"./BaseCollection":11}],17:[function(require,module,exports){
/**
 * MODEL: User
 *
 */

var Projects = require("./Projects");
var Dashboards = require("./Dashboards");
var Collections = require("./Collections");

module.exports = Backbone.Model.extend({

  idAttribute: "_id",

  defaults: {
    collections: new Collections(),
    dashboards: new Collections(),
    projects: new Projects(),
    contributions: new Projects(),
    likes: new Projects()
  },

  urlRoot: function(){
    return hackdash.apiURL + '/profiles';
  },

  parse: function(response){

    response.collections = new Collections(response.collections);
    response.dashboards = new Dashboards(response.dashboards);

    response.projects = new Projects(response.projects);
    response.contributions = new Projects(response.contributions);
    response.likes = new Projects(response.likes);

    response.dashboards.each(function(dash){
      var title = dash.get('title');
      if (!title || (title && !title.length)){
        dash.set('title', dash.get('domain'));
      }
    });

    return response;
  }

});

},{"./Collections":13,"./Dashboards":16,"./Projects":19}],18:[function(require,module,exports){
/**
 * MODEL: Project
 *
 */

module.exports = Backbone.Model.extend({

  idAttribute: "_id",

  defaults: {
    active: true
  },

  urlRoot: function(){
    return hackdash.apiURL + '/projects';
  },

  doAction: function(type, res, done){
    $.ajax({
      url: this.url() + '/' + res,
      type: type,
      context: this
    }).done(done);
  },

  updateList: function(type, add){
    var list = this.get(type);
    if (!hackdash.user){
      return;
    }

    var uid = hackdash.user._id;

    function exists(){
      return _.find(list, function(usr){
        return (usr._id === uid);
      }) ? true : false;
    }

    if (add && !exists()){
      list.push(hackdash.user);
    }
    else if (!add && exists()){
      var idx = 0;
      _.each(list, function(usr, i){
        if (usr._id === uid) {
          idx = i;
        }
      });

      list.splice(idx, 1);
    }

    this.set(type, list);
    this.trigger("change");
  },

  join: function(){
    this.doAction("POST", "contributors", function(){
      this.updateList("contributors", true);
      window._gaq.push(['_trackEvent', 'Project', 'Join']);
    });
  },

  leave: function(){
    this.doAction("DELETE", "contributors", function(){
      this.updateList("contributors", false);
      window._gaq.push(['_trackEvent', 'Project', 'Leave']);
    });
  },

  follow: function(){
    this.doAction("POST", "followers", function(){
      this.updateList("followers", true);
      window._gaq.push(['_trackEvent', 'Project', 'Follow']);
    });
  },

  unfollow: function(){
    this.doAction("DELETE", "followers", function(){
      this.updateList("followers", false);
      window._gaq.push(['_trackEvent', 'Project', 'Unfollow']);
    });
  },

  toggleContribute: function(){
    if (this.isContributor()){
      return this.leave();
    }

    this.join();
  },

  toggleFollow: function(){
    if (this.isFollower()){
      return this.unfollow();
    }

    this.follow();
  },

  isContributor: function(){
    return this.userExist(this.get("contributors"));
  },

  isFollower: function(){
    return this.userExist(this.get("followers"));
  },

  userExist: function(arr){

    if (!hackdash.user){
      return false;
    }

    var uid = hackdash.user._id;
    return arr && _.find(arr, function(usr){
      return (usr._id === uid);
    }) ? true : false;
  },

});


},{}],19:[function(require,module,exports){
/**
 * Collection: Projectss
 *
 */

var
  Project = require('./Project'),
  BaseCollection = require('./BaseCollection');

var Projects = module.exports = BaseCollection.extend({

  model: Project,

  idAttribute: "_id",

  comparators: {
    title: function(a){ return a.get('title'); },
    created_at: function(a){ return -a.get('created_at'); },
    showcase: function(a){ return a.get('showcase'); }
  },

  url: function(){
    if (this.domain){
      return hackdash.apiURL + '/' + this.domain + '/projects';
    }
    return hackdash.apiURL + '/projects';
  },

  parse: function(response){

    this.allItems = response;

    if (hackdash.app.type !== "dashboard"){
      //it is not a dashboard so all projects active
      return response;
    }

    var dashboard = hackdash.app.dashboard;

    var showcase = (dashboard && dashboard.get("showcase")) || [];
    if (showcase.length === 0){
      //no showcase defined: all projects are active
      return response;
    }

    // set active property of a project from showcase mode
    // (only projects at showcase array are active ones)
    _.each(response, function(project){

      if (showcase.indexOf(project._id) >= 0){
        project.active = true;
      }
      else {
        project.active = false;
      }

    });

    return response;
  },

  runSort: function(key){
    this.comparator = this.comparators[key];
    this.sort().trigger('reset');
  },

  buildShowcase: function(showcase){
    _.each(showcase, function(id, i){
      var found = this.where({ _id: id, active: true });
      if (found.length > 0){
        found[0].set("showcase", i);
      }
    }, this);

    this.trigger("reset");
  },

  getActives: function(){
    return new Projects(
      this.filter(function(project){
        return project.get("active");
      })
    );
  },

  getInactives: function(){
    return new Projects(
      this.filter(function(project){
        return !project.get("active");
      })
    );
  },

  search: function(keywords){

    if (keywords.length === 0){
      this.reset(this.allItems);
      return;
    }

    keywords = keywords.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");

    var regex = new RegExp(keywords, 'i');
    var items = [];

    _.each(this.allItems, function(project){
      if (
        regex.test(project.title) ||
        regex.test(project.description) ||
        regex.test(project.tags.join(' '))
        ) {

          return items.push(project);
      }
    });

    this.reset(items);
  },

  getStatusCount: function(){
    var statuses = window.hackdash.statuses;
    var statusCount = {};

    _.each(statuses, function(status){
      statusCount[status] = this.where({ status: status }).length;
    }, this);

    return statusCount;
  }

});

},{"./BaseCollection":11,"./Project":18}],20:[function(require,module,exports){
/**
 * Collection of Users
 *
 */

var User = require('./User');

module.exports = Backbone.Collection.extend({

  model: User,

  idAttribute: "_id",

  url: function(){
    return hackdash.apiURL + '/users/team';
  },

});


},{"./User":21}],21:[function(require,module,exports){
/**
 * MODEL: User
 *
 */

module.exports = Backbone.Model.extend({

  idAttribute: "_id",

});

},{}],22:[function(require,module,exports){
/**
 * Collection: Users
 *
 */

var
  User = require('./User'),
  BaseCollection = require('./BaseCollection');

module.exports = BaseCollection.extend({

  model: User,

  idAttribute: "_id",

  url: function(){
    return hackdash.apiURL + '/users';
  },

});


},{"./BaseCollection":11,"./User":21}],23:[function(require,module,exports){
/**
 * VIEW: Collection Header Layout
 *
 */

var
    template = require('./templates/collection.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  ui: {
    "title": "#collection-title",
    "description": "#collection-description",
    "link": "#collection-link"
  },

  templateHelpers: {
    isAdmin: function(){
      return hackdash.user && hackdash.user._id === this.owner._id;
    }
  },

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    if (hackdash.user &&
        hackdash.user._id === this.model.get('owner')._id){

      this.initEditables();
    }

    $('.tooltips', this.$el).tooltip({});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  placeholders: {
    title: __("Collection of Hackathons Title"),
    description: __("brief description of this collection of hackathons")
  },

  initEditables: function(){
    this.initEditable("title", '<input type="text" maxlength="30">');
    this.initEditable("description", '<textarea maxlength="250"></textarea>', 'textarea');
  },

  initEditable: function(type, template, control){
    var ph = this.placeholders;
    var self = this;

    if (this.ui[type].length > 0){

      this.ui[type].editable({
        type: control || 'text',
        title: ph[type],
        emptytext: ph[type],
        placeholder: ph[type],
        tpl: template,
        success: function(response, newValue) {
          self.model.set(type, newValue);
          self.model.save();
        }
      });
    }
  },

});
},{"./templates/collection.hbs":25}],24:[function(require,module,exports){
/**
 * VIEW: Collection Dashboards Layout
 *
 */

var template = require('./templates/index.hbs')
  , CollectionView = require('./Collection')
  , DashboardsView = require('../Dashboard/Collection');

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "page-ctn collection",
  template: template,

  regions: {
    "collection": ".coll-details",
    "dashboards": "#collection-dashboards"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){

    this.collection.show(new CollectionView({
      model: this.model
    }));

    this.dashboards.show(new DashboardsView({
      model: this.model,
      collection: this.model.get('dashboards')
    }));

  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"../Dashboard/Collection":29,"./Collection":23,"./templates/index.hbs":26}],25:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "\r\n  <h1>\r\n    <a id=\"collection-title\">"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</a>\r\n  </h1>\r\n\r\n  <p>\r\n    <a id=\"collection-description\">"
    + escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"description","hash":{},"data":data}) : helper)))
    + "</a>\r\n  </p>\r\n\r\n";
},"3":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"if","hash":{},"fn":this.program(4, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.description : depth0), {"name":"if","hash":{},"fn":this.program(6, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\r\n";
},"4":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <h1>"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</h1>\r\n";
},"6":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <p>"
    + escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"description","hash":{},"data":data}) : helper)))
    + "</p>\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isAdmin : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.program(3, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"useData":true});

},{"hbsfy/runtime":103}],26:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  return "\r\n<div class=\"header\">\r\n  <div class=\"container\">\r\n    <div class=\"coll-details\"></div>\r\n  </div>\r\n</div>\r\n\r\n<div class=\"body\">\r\n\r\n  <div class=\"container\">\r\n    <div id=\"collection-dashboards\"></div>\r\n  </div>\r\n\r\n</div>\r\n";
  },"useData":true});

},{"hbsfy/runtime":103}],27:[function(require,module,exports){
/**
 * VIEW: A User Collection
 *
 */

var template = require('./templates/addAdmin.hbs')
  , Users = require('../../models/Users');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "add-admins-modal",
  template: template,

  ui: {
    "txtUser": "#txtUser",
    "addOn": ".add-on"
  },

  events: {
    "click #save": "saveAdmin"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    this.users = new Users();
  },

  onRender: function(){
    this.initTypehead();
  },

  serializeData: function(){
    return _.extend({
      showAdmin: (this.collection.length > 1 ? false : true)
    }, (this.model && this.model.toJSON()) || {});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  saveAdmin: function(){
    var selected = this.users.find(function(user){
      return user.get('selected');
    });

    if (selected){
      this.collection.addAdmin(selected.get("_id"));
      this.destroy();
    }
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  initTypehead: function(){
    var users = this.users,
      self = this,
      MIN_CHARS_FOR_SERVER_SEARCH = 3;

    this.ui.txtUser.typeahead({
      source: function(query, process){
        if (query.length >= MIN_CHARS_FOR_SERVER_SEARCH){
          users.fetch({
            data: $.param({ q: query }),
            success: function(){
              var usersIds = users.map(function(user){ return user.get('_id').toString(); });
              process(usersIds);
            }
          });
        }
        else {
          process([]);
        }
      },
      matcher: function(){
        return true;
      },
      highlighter: function(uid){
        var user = users.get(uid),
          template = _.template('<img class="avatar" src="<%= picture %>" /> <%= name %>');

        return template({
          picture: user.get('picture'),
          name: user.get('name')
        });
      },
      updater: function(uid) {
        var selectedUser = users.get(uid);
        selectedUser.set('selected', true);
        self.ui.addOn.empty().append('<img class="avatar" src="' + selectedUser.get("picture") + '" />');
        return selectedUser.get('name');
      }
    });
  }

});
},{"../../models/Users":22,"./templates/addAdmin.hbs":35}],28:[function(require,module,exports){
/**
 * VIEW: An Dashboard of HOME Search
 *
 */

var template = require('./templates/card.hbs');
var ItemView = require('../Home/Item.js');

module.exports = ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'entity dashboard',
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  getURL: function(){
    return "/dashboards/" + this.model.get("domain");
  },

  afterRender: function(){
    var list = $('.list',this.$el);
    var count = this.model.get('covers').length;

    if (count === 0){
      return;
    }

    list.addClass('grid-1');
/*
    if (count >= 4){
      list.addClass('grid-4');
    }

    switch(count){
      case 1: list.addClass('grid-1'); break;
      case 2: list.addClass('grid-2'); break;
      case 3: list.addClass('grid-3'); break;
    }
*/
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"../Home/Item.js":52,"./templates/card.hbs":36}],29:[function(require,module,exports){
/**
 * VIEW: Dashboards
 *
 */

var Dashboard = require('./Card');

module.exports = Backbone.Marionette.CollectionView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "entities",
  childView: Dashboard,

  gutter: 5,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){

    var self = this;
    _.defer(function(){
      self.updateGrid();
      self.refresh();
    });

  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  updateGrid: function(){
    if (!this.wall){
      this.wall = new window.freewall(this.$el);
    }

    this.wall.reset({
      selector: '.entity',
      cellW: 200,
      cellH: 200,
      gutterY: this.gutter,
      gutterX: this.gutter,
      onResize: this.refresh.bind(this)
    });

  },

  refresh: function(){
    this.wall.fitWidth();
    this.wall.refresh();
    this.fixSize();
  },

  fixSize: function(){
    this.$el.height(this.$el.height() + this.gutter*4);
  },

});
},{"./Card":28}],30:[function(require,module,exports){
/**
 * VIEW: DashboardHeader Layout
 *
 */

var
    template = require('./templates/dashboard.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  ui: {
    "title": "#dashboard-title",
    "description": "#dashboard-description",
    "link": "#dashboard-link"
  },

  events: {
    "click .logo": "stopPropagation"
  },

  templateHelpers: {
    hackdashURL: function(){
      return "//" + hackdash.baseURL;
    },
    isAdmin: function(){
      var user = hackdash.user;
      return user && user.admin_in.indexOf(this.domain) >= 0 || false;
    }
  },

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    var user = hackdash.user;

    if (user){
      var isAdmin = user.admin_in.indexOf(this.model.get("domain")) >= 0;

      if (isAdmin){
        this.initEditables();
      }
    }

    $('.tooltips', this.$el).tooltip({});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  stopPropagation: function(e){
    e.stopPropagation();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  placeholders: {
    title: __("Hackathon Title"),
    description: __("brief description of this hackathon"),
    link: __("url to hackathon site"),
  },

  initEditables: function(){
    this.initEditable("title", '<input type="text" maxlength="30">');
    this.initEditable("description", '<textarea maxlength="250"></textarea>', 'textarea');
    this.initEditable("link");
  },

  initEditable: function(type, template, control){
    var ph = this.placeholders;
    var self = this;

    if (this.ui[type].length > 0){

      this.ui[type].editable({
        type: control || 'text',
        title: ph[type],
        emptytext: ph[type],
        placeholder: ph[type],
        tpl: template,
        success: function(response, newValue) {
          self.model.set(type, newValue);
          self.model.save();
        }
      });
    }
  },

});
},{"./templates/dashboard.hbs":37}],31:[function(require,module,exports){
/**
 * VIEW: Login Modal
 *
 */

var template = require('./templates/share.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "share",
  template: template,

  ui: {
    'prg': '#prg',
    'pic': '#pic',
    'title': '#title',
    'desc': '#desc',
    'logo': '#logo',
    'contrib': '#contrib',
    'slider': '#slider',
    'acnbar': '#acnbar',
    'searchbox': '#keywords',

    'status': 'select[name=status]',
    'preview': '.preview iframe',
    'code': '#embed-code',
    'sharelink': '.dash-share-link a'
  },

  events: {
    "click .close": "destroy",
    "click .checkbox": "onClickSetting",
    "keyup @ui.searchbox": "onKeyword",
    "click .btn-group>.btn": "sortClicked",
    "change @ui.status": "onChangeStatus",
    "change #slides": "onChangeSlider"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    this.embedTmpl = _.template('<iframe src="<%= url %>" width="100%" height="450" frameborder="0" allowtransparency="true" title="Hackdash"></iframe>');
  },

  onRender: function(){
    this.reloadPreview();
    $('.modal > .modal-dialog').addClass('big-modal');
  },

  serializeData: function(){
    return _.extend({
      settings: this.settings,
      pSettings: this.projectSettings,
      statuses: this.getStatuses()
    }, this.model.toJSON());
  },

  onDestroy: function(){
    $('.modal > .modal-dialog').removeClass('big-modal');
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  hiddenSettings: [],
  keywords: '',
  sorting: '',
  status: '',
  slider: 0,

  onClickSetting: function(e){
    var ele = $('input', e.currentTarget);
    var id = ele.attr('id');
    var checked = $(ele).is(':checked');
    var idx = this.hiddenSettings.indexOf(id);

    if (id === 'slider'){
      this.onChangeSlider();
      return;
    }

    if (ele.attr('disabled')){
      return;
    }

    function toggleLogo(){
      if (id === "title" && !this.ui.title.is(':checked')){
        this.ui.logo
          .attr('disabled', 'disabled')
          .parents('.checkbox').addClass('disabled');
      }
      else {
        this.ui.logo
          .attr('disabled', false)
          .parents('.checkbox').removeClass('disabled');
      }
    }

    if (checked){
      if(idx > -1){
        this.hiddenSettings.splice(idx, 1);
        this.reloadPreview();
      }

      toggleLogo.call(this);
      return;
    }

    if (idx === -1){
      this.hiddenSettings.push(id);
      this.reloadPreview();
      toggleLogo.call(this);
    }
  },

  onChangeSlider: function(){
    var checked = $("#slider", this.$el).is(':checked');
    var slides = parseInt($('#slides', this.$el).val(), 10);

    if (!slides || slides < 1){
      slides = 1;
    }
    if (slides > 6){
      slides = 6;
    }

    $('#slides', this.$el).val(slides);

    this.slider = checked ? (slides || 1) : 0;

    this.reloadPreview();
  },

  onChangeStatus: function(){
    this.status = this.ui.status.val();

    if (this.status.toLowerCase() === 'all'){
      this.status = null;
    }

    this.reloadPreview();
  },

  onKeyword: function(){
    this.keywords = this.ui.searchbox.val();
    this.reloadPreview();
  },

  sortClicked: function(e){
    e.preventDefault();
    this.sorting = $('input[type=radio]', e.currentTarget)[0].id;
    this.reloadPreview();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  getStatuses: function(){
    var counts = hackdash.app.projects.getStatusCount();
    return _.map(counts, function(item, key){
      return { name: key, count: item };
    });
  },

  reloadPreview: function(){
    var embedUrl = window.location.protocol + "//" + window.location.host;
    var fragment = '/embed/dashboards/' + this.model.get('domain');
    var hide = 'hide=';
    var query = (this.keywords ? '&query=' + this.keywords : '');
    var sort = (this.sorting ? '&sort=' + this.sorting : '');
    var status = (this.status ? '&status=' + this.status : '');
    var slider = (this.slider > 0 ? '&slider=' + this.slider : '');

    _.each(this.hiddenSettings, function(id){
      hide += id + ',';
    }, this);

    var url = embedUrl + fragment + '?' +
      (this.hiddenSettings.length ? hide : '') + query + sort + status + slider;

    this.ui.preview.attr('src', url);
    this.ui.code.val(this.embedTmpl({ url: url }));
    this.ui.sharelink.attr({ href: url }).text(url);
  },

  settings: [{
    code: 'title',
    name: 'Title'
  }, {
    code: 'desc',
    name: 'Description'
  }, {
    code: 'logo',
    name: 'Hackdash Logo'
  }],

  projectSettings: [{
    code: 'pprg',
    name: 'Progress',
    project: true
  }, {
    code: 'ptitle',
    name: 'Title',
    project: true
  }, {
    code: 'pcontrib',
    name: 'Contributors',
    project: true
  }, {
    code: 'pacnbar',
    name: 'Action Bar',
    project: true
  }]

});
},{"./templates/share.hbs":39}],32:[function(require,module,exports){
/**
 * VIEW: User
 *
 */

var template = require('./templates/user.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  tagName: "li",
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    $('.tooltips', this.$el).tooltip({});
  }

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./templates/user.hbs":40}],33:[function(require,module,exports){
/**
 * VIEW: Collection of Users
 *
 */

var template = require('./templates/users.hbs')
  , User = require('./User')
  , AddAdmin = require('./AddAdmin');

module.exports = Backbone.Marionette.CompositeView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  childViewContainer: "ul",
  childView: User,

  events: {
    "click a.add-admins": "showAddAdmins"
  },

  templateHelpers: {
    isAdmin: function(){
      var user = hackdash.user;
      return user && user.admin_in.indexOf(this.domain) >= 0 || false;
    }
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    $('.tooltips', this.$el).tooltip({});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  showAddAdmins: function(){
    hackdash.app.modals.show(new AddAdmin({
      collection: this.collection
    }));
  }

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./AddAdmin":27,"./User":32,"./templates/users.hbs":41}],34:[function(require,module,exports){
/**
 * VIEW: Dashboard Projects Layout
 *
 */

var template = require('./templates/index.hbs')
  , UsersView = require('./Users')
  , DashboardView = require('./Dashboard')
  , ProjectsView = require('../Project/Collection')
  , Sharer = require("../Sharer");

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "page-ctn dashboard",
  template: template,

  ui: {
    inactiveCtn: ".inactive-ctn",
    shareLink: '.share'
  },

  events: {
    "click .share": "showShare",
    "click .login": "showLogin"
  },

  regions: {
    "dashboard": ".dash-details",
    "admins": ".dash-admins",
    "projects": "#dashboard-projects",
    "inactives": "#inactive-projects"
  },

  modelEvents:{
    "edit:showcase": "onStartEditShowcase",
    "end:showcase": "onEndEditShowcase",
    "save:showcase": "onSaveEditShowcase"
  },

  templateHelpers: {
    isDashOpen: function(){
      var isDashboard = (hackdash.app.type === "dashboard" ? true : false);
      if (!isDashboard){
        return false;
      }
      return this.open;
    }
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  showcaseMode: false,
  showcaseSort: false,

  onRender: function(){
    var self = this;

    this.dashboard.show(new DashboardView({
      model: this.model
    }));

    this.model.get("admins").fetch().done(function(){
      self.admins.show(new UsersView({
        model: self.model,
        collection: self.model.get("admins")
      }));
    });

    if (this.showcaseMode){
      this.projects.show(new ProjectsView({
        model: this.model,
        collection: hackdash.app.projects.getActives(),
        showcaseMode: true
      }));

      this.ui.inactiveCtn.removeClass("hide");

      this.inactives.show(new ProjectsView({
        model: this.model,
        collection: hackdash.app.projects.getInactives()
      }));

      hackdash.app.projects.off("change:active").on("change:active", function(){
        self.projects.currentView.collection = hackdash.app.projects.getActives();
        self.inactives.currentView.collection = hackdash.app.projects.getInactives();

        self.model.isDirty = true;

        self.projects.currentView.render();
        self.inactives.currentView.render();
      });
    }
    else {
      this.ui.inactiveCtn.addClass("hide");

      var pView = new ProjectsView({
        model: this.model,
        collection: hackdash.app.projects,
        showcaseMode: false,
        showcaseSort: this.showcaseSort
      });

      pView.on('ended:render', function(){
        var sort = hackdash.getQueryVariable('sort');
        if (!self.showcaseSort && sort){
          pView['sortBy' + sort.charAt(0).toUpperCase() + sort.slice(1)]();
        }
      });

      this.projects.show(pView);
    }

    $(".tooltips", this.$el).tooltip({});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  showLogin: function(){
    hackdash.app.showLogin();
  },

  showShare: function(){
    Sharer.show(this.ui.shareLink, {
      type: 'dashboard',
      model: this.model
    });
  },

  onStartEditShowcase: function(){
    this.showcaseMode = true;
    this.render();
  },

  onSaveEditShowcase: function(){
    var showcase = this.projects.currentView.updateShowcaseOrder();
    this.model.save({ "showcase": showcase });

    this.model.isDirty = false;
    this.onEndEditShowcase();
  },

  onEndEditShowcase: function(){
    this.model.isShowcaseMode = false;
    this.model.trigger("change");

    this.showcaseSort = true;
    this.showcaseMode = false;
    this.render();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});

},{"../Project/Collection":84,"../Sharer":92,"./Dashboard":30,"./Users":33,"./templates/index.hbs":38}],35:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <p class=\"bg-warning\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Warning! you will NOT", {"name":"__","hash":{},"data":data})))
    + "</p>\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<div class=\"modal-header\">\r\n  <button type=\"button\" data-dismiss=\"modal\" aria-hidden=\"true\" class=\"close\">×</button>\r\n  <h3>Add Dashboard Admin</h3>\r\n</div>\r\n<div class=\"modal-body\">\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.showAdmin : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  <div class=\"input-group\">\r\n    <span class=\"input-group-addon\">\r\n      <i class=\"fa fa-user\"></i>\r\n    </span>\r\n    <input id=\"txtUser\" type=\"text\" class=\"form-control\" placeholder='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "type name or username", {"name":"__","hash":{},"data":data})))
    + "' autocomplete=\"off\">\r\n  </div>\r\n</div>\r\n<div class=\"modal-footer\">\r\n  <input id=\"save\" type=\"button\" class=\"btn btn-success pull-right\" value=\"ADD\">\r\n  <a class=\"btn-cancel pull-left\" data-dismiss=\"modal\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "cancel", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n</div>";
},"useData":true});

},{"hbsfy/runtime":103}],36:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  return "list";
  },"3":function(depth0,helpers,partials,data) {
  var lambda=this.lambda, escapeExpression=this.escapeExpression;
  return "  <div style=\"background-image: url("
    + escapeExpression(lambda(depth0, depth0))
    + ");\"></div>\r\n";
},"5":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <i class=\"item-letter\">"
    + escapeExpression(((helpers.firstLetter || (depth0 && depth0.firstLetter) || helperMissing).call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"firstLetter","hash":{},"data":data})))
    + "</i>\r\n";
},"7":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <i class=\"item-letter\">"
    + escapeExpression(((helpers.firstLetter || (depth0 && depth0.firstLetter) || helperMissing).call(depth0, (depth0 != null ? depth0.domain : depth0), {"name":"firstLetter","hash":{},"data":data})))
    + "</i>\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, helperMissing=helpers.helperMissing, functionType="function", escapeExpression=this.escapeExpression, buffer = "<div class=\"cover ";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.covers : depth0)) != null ? stack1.length : stack1), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\">\r\n";
  stack1 = ((helpers.each_upto_rnd || (depth0 && depth0.each_upto_rnd) || helperMissing).call(depth0, (depth0 != null ? depth0.covers : depth0), 1, {"name":"each_upto_rnd","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"if","hash":{},"fn":this.program(5, data),"inverse":this.program(7, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</div>\r\n\r\n<div class=\"details\">\r\n  <div>\r\n    <h2>"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</h2>\r\n    <h3>"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "</h3>\r\n  </div>\r\n</div>\r\n\r\n<div class=\"action-bar text-center\">\r\n  <i class=\"fa fa-clock-o timer\" title=\""
    + escapeExpression(((helpers.timeAgo || (depth0 && depth0.timeAgo) || helperMissing).call(depth0, (depth0 != null ? depth0.created_at : depth0), {"name":"timeAgo","hash":{},"data":data})))
    + "\"></i>\r\n  <span>"
    + escapeExpression(((helper = (helper = helpers.projectsCount || (depth0 != null ? depth0.projectsCount : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"projectsCount","hash":{},"data":data}) : helper)))
    + " "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Projects", {"name":"__","hash":{},"data":data})))
    + "</span>\r\n</div>";
},"useData":true});

},{"hbsfy/runtime":103}],37:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "\r\n  <h1>\r\n    <a id=\"dashboard-title\">"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</a>\r\n  </h1>\r\n\r\n  <p>\r\n    <a id=\"dashboard-description\">"
    + escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"description","hash":{},"data":data}) : helper)))
    + "</a>\r\n  </p>\r\n\r\n  <p>\r\n    <a id=\"dashboard-link\">"
    + escapeExpression(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"link","hash":{},"data":data}) : helper)))
    + "</a>\r\n  </p>\r\n\r\n";
},"3":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"if","hash":{},"fn":this.program(4, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.description : depth0), {"name":"if","hash":{},"fn":this.program(7, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\r\n";
},"4":function(depth0,helpers,partials,data) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing, escapeExpression=this.escapeExpression, buffer = "  <h1>\r\n";
  stack1 = ((helper = (helper = helpers.isEmbed || (depth0 != null ? depth0.isEmbed : depth0)) != null ? helper : helperMissing),(options={"name":"isEmbed","hash":{},"fn":this.program(5, data),"inverse":this.noop,"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isEmbed) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "    "
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "\r\n  </h1>\r\n";
},"5":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <a class=\"logo\" href=\""
    + escapeExpression(((helper = (helper = helpers.hackdashURL || (depth0 != null ? depth0.hackdashURL : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"hackdashURL","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\"></a>\r\n";
},"7":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <p>"
    + escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"description","hash":{},"data":data}) : helper)))
    + "</p>\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1;
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isAdmin : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.program(3, data),"data":data});
  if (stack1 != null) { return stack1; }
  else { return ''; }
  },"useData":true});

},{"hbsfy/runtime":103}],38:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <a class=\"dash-details\" href=\"/dashboards/"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\"></a>\r\n";
},"3":function(depth0,helpers,partials,data) {
  return "    <div class=\"dash-details\"></div>\r\n";
  },"5":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <a class=\"link tooltips\" href=\""
    + escapeExpression(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"link","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\"\r\n        data-bypass data-original-title='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Open dashboard website", {"name":"__","hash":{},"data":data})))
    + "'>\r\n          <i class=\"fa fa-link\"></i>\r\n        </a>\r\n";
},"7":function(depth0,helpers,partials,data) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing, buffer = "    <div class=\"dash-create visible-xs\">\r\n      <h3 class=\"create-project\">\r\n        <i class=\"fa fa-plus\"></i>\r\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : helperMissing),(options={"name":"isLoggedIn","hash":{},"fn":this.program(8, data),"inverse":this.program(10, data),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isLoggedIn) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "      </h3>\r\n    </div>\r\n";
},"8":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <a href=\"/dashboards/"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "/create\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Create Project", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"10":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <a class=\"login\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Create Project", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing, escapeExpression=this.escapeExpression, buffer = "\r\n<div class=\"header\">\r\n  <div class=\"container\">\r\n\r\n";
  stack1 = ((helper = (helper = helpers.isEmbed || (depth0 != null ? depth0.isEmbed : depth0)) != null ? helper : helperMissing),(options={"name":"isEmbed","hash":{},"fn":this.program(1, data),"inverse":this.program(3, data),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isEmbed) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n    <div class=\"dash-admins\"></div>\r\n\r\n    <div class=\"dash-buttons\">\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.link : depth0), {"name":"if","hash":{},"fn":this.program(5, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "      <a class=\"share tooltips\" data-original-title='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Share this Dashboard", {"name":"__","hash":{},"data":data})))
    + "'>\r\n        <i class=\"fa fa-share-alt\"></i>\r\n      </a>\r\n    </div>\r\n\r\n";
  stack1 = ((helper = (helper = helpers.isDashOpen || (depth0 != null ? depth0.isDashOpen : depth0)) != null ? helper : helperMissing),(options={"name":"isDashOpen","hash":{},"fn":this.program(7, data),"inverse":this.noop,"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isDashOpen) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\r\n  </div>\r\n</div>\r\n\r\n<div class=\"body\">\r\n\r\n  <div class=\"container\">\r\n\r\n    <div id=\"dashboard-projects\"></div>\r\n    <div id=\"inactive-projects\" class=\"hide inactive-ctn\"></div>\r\n\r\n  </div>\r\n\r\n</div>\r\n";
},"useData":true});

},{"hbsfy/runtime":103}],39:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "\r\n        <div class=\"checkbox\">\r\n          <label>\r\n            <input id=\""
    + escapeExpression(((helper = (helper = helpers.code || (depth0 != null ? depth0.code : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"code","hash":{},"data":data}) : helper)))
    + "\" type=\"checkbox\" checked> "
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\r\n          </label>\r\n        </div>\r\n\r\n";
},"3":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "\r\n          <div class=\"checkbox\">\r\n            <label>\r\n              <input id=\""
    + escapeExpression(((helper = (helper = helpers.code || (depth0 != null ? depth0.code : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"code","hash":{},"data":data}) : helper)))
    + "\" type=\"checkbox\" checked> "
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\r\n            </label>\r\n          </div>\r\n\r\n";
},"5":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "              <option value=\""
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\">"
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + " ["
    + escapeExpression(((helper = (helper = helpers.count || (depth0 != null ? depth0.count : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"count","hash":{},"data":data}) : helper)))
    + "]</option>\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", buffer = "<div class=\"modal-body\">\r\n\r\n  <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\r\n    <i class=\"fa fa-close\"></i>\r\n  </button>\r\n\r\n  <div class=\"row\">\r\n    <div class=\"col-md-5 col-lg-3\">\r\n\r\n      <h1>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "embed this dashboard", {"name":"__","hash":{},"data":data})))
    + "</h1>\r\n\r\n      <div class=\"settings\">\r\n\r\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.settings : depth0), {"name":"each","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n        <form class=\"form-inline slider\">\r\n          <div class=\"form-group\">\r\n            <div class=\"checkbox\">\r\n              <label>\r\n                <input id=\"slider\" type=\"checkbox\">\r\n              </label>\r\n            </div>\r\n            <label for=\"slider\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Slider", {"name":"__","hash":{},"data":data})))
    + "</label>\r\n            <input id=\"slides\" type=\"number\" min=\"1\" max=\"6\" value=\"1\">\r\n          </div>\r\n        </form>\r\n\r\n        <div>\r\n          <h5>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Projects", {"name":"__","hash":{},"data":data})))
    + "</h5>\r\n\r\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.pSettings : depth0), {"name":"each","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n          <div class=\"form-group\">\r\n            <select name=\"status\" class=\"form-control status\" value=\""
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\">\r\n              <option value=\"all\" selected=\"true\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "ANY STATUS", {"name":"__","hash":{},"data":data})))
    + "</option>\r\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.statuses : depth0), {"name":"each","hash":{},"fn":this.program(5, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "            </select>\r\n          </div>\r\n\r\n        </div>\r\n\r\n      </div>\r\n\r\n      <label class=\"get-code\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Add this dashboard to your website by coping this code below", {"name":"__","hash":{},"data":data})))
    + "</label>\r\n      <textarea id=\"embed-code\" onclick=\"this.focus();this.select();\" readonly=\"readonly\"></textarea>\r\n\r\n    </div>\r\n    <div class=\"col-md-7 col-lg-9\" style=\"position:relative;\">\r\n\r\n      <div class=\"col-xs-12 col-sm-12 share-dashboard-filters\">\r\n\r\n        <div class=\"col-xs-12 col-sm-4 col-md-4\">\r\n          <input id=\"keywords\" type=\"text\" class=\"form-control\" placeholder=\"keywords\">\r\n        </div>\r\n\r\n        <div class=\"col-xs-12 col-sm-8 col-md-8\">\r\n          <div class=\"btn-group pull-right\" data-toggle=\"buttons\">\r\n            <label class=\"btn btn-default\">\r\n              <input type=\"radio\" name=\"options\" id=\"name\" autocomplete=\"off\"> "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "By Name", {"name":"__","hash":{},"data":data})))
    + "\r\n            </label>\r\n            <label class=\"btn btn-default active\">\r\n              <input type=\"radio\" name=\"options\" id=\"date\" autocomplete=\"off\"> "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "By Date", {"name":"__","hash":{},"data":data})))
    + "\r\n            </label>\r\n            <label class=\"btn btn-default\">\r\n              <input type=\"radio\" name=\"options\" id=\"showcase\" autocomplete=\"off\"> "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Showcase", {"name":"__","hash":{},"data":data})))
    + "\r\n            </label>\r\n          </div>\r\n        </div>\r\n\r\n      </div>\r\n\r\n      <div class=\"col-xs-12 dash-share-link\">\r\n        <h3>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Share Link", {"name":"__","hash":{},"data":data})))
    + "</h3>\r\n        <a target=\"_blank\" data-bypass=\"true\"></a>\r\n      </div>\r\n\r\n      <div class=\"col-xs-12 dash-preview-help\">\r\n        <h3>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Preview", {"name":"__","hash":{},"data":data})))
    + "</h3>\r\n        <p>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "The embedded code will show exactly what's below", {"name":"__","hash":{},"data":data})))
    + "</p>\r\n      </div>\r\n\r\n      <div class=\"col-xs-12 preview\">\r\n        <iframe width=\"100%\" height=\"450\" title=\"Hackdash\" frameborder=\"0\" allowtransparency=\"true\"></iframe>\r\n      </div>\r\n    </div>\r\n  </div>\r\n\r\n</div>\r\n";
},"useData":true});

},{"hbsfy/runtime":103}],40:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<a href=\"/users/"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "\">\r\n  "
    + escapeExpression(((helpers.getProfileImage || (depth0 && depth0.getProfileImage) || helperMissing).call(depth0, depth0, {"name":"getProfileImage","hash":{},"data":data})))
    + "\r\n</a>";
},"useData":true});

},{"hbsfy/runtime":103}],41:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<a class=\"tooltips add-admins\" title='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Add admins", {"name":"__","hash":{},"data":data})))
    + "'>\r\n  <i class=\"fa fa-plus\"></i>\r\n</a>\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = "<ul></ul>\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isAdmin : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"useData":true});

},{"hbsfy/runtime":103}],42:[function(require,module,exports){

var
    template = require('./templates/footer.hbs')
  , Dashboard = require('../../models/Dashboard');

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "footer",
  template: template,

  ui: {
    "switcher": ".dashboard-btn",
    "showcaseMode": ".btn-showcase-mode",
    "createShowcase": ".btn-new-project",
    "footerToggle": ".footer-toggle-ctn",
    "up": ".up-button"
  },

  events: {
    "click .dashboard-btn": "onClickSwitcher",
    "click .btn-showcase-mode": "changeShowcaseMode",
    "click @ui.up": "goTop"
  },

  templateHelpers: {
    isAdmin: function(){
      var user = hackdash.user;
      return user && user.admin_in.indexOf(this.domain) >= 0 || false;
    },
    isDashboard: function(){
      return (hackdash.app.type === "dashboard");
    }
  },

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    $('.tooltips', this.$el).tooltip({});
    this.setStatics();
/*
    if (hackdash.app.type !== "dashboard"){
      this.$el.addClass('unlocked');
    }
*/
  },

  serializeData: function(){

    if (this.model && this.model instanceof Dashboard){

      var msg = __("This Dashboard is open: click to close");

      if (!this.model.get("open")) {
        msg = __("This Dashboard is closed: click to reopen");
      }

      return _.extend({
        switcherMsg: msg
      }, this.model.toJSON());
    }

    return (this.model && this.model.toJSON()) || {};
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  onClickSwitcher:function(){
    var open = true;

    if (this.ui.switcher.hasClass("dash-open")){
      open = false;
    }

    $('.tooltips', this.$el).tooltip('hide');

    this.model.set({ "open": open }, { trigger: false });
    this.model.save({ wait: true });
  },

  upBlocked: false,
  goTop: function(){

    if (!this.upBlocked){
      this.upBlocked = true;

      var body = $("html, body"), self = this;
      body.animate({ scrollTop:0 }, 1500, 'swing', function() {
        self.upBlocked = false;
      });
    }
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  changeShowcaseMode: function(){
    if (this.ui.showcaseMode.hasClass("on")){

      this.model.trigger("save:showcase");
      this.model.trigger("end:showcase");

      this.model.isShowcaseMode = false;

      this.ui.showcaseMode
        .html("<i class='btn-danger txt'>" + __("turned_off") + "</i><div>" + __("Edit Showcase") + "</div>")
        .removeClass("on");

      this.ui.createShowcase.removeClass("hide");
      this.ui.footerToggle.removeClass("hide");
    }
    else {
      this.model.isShowcaseMode = true;
      this.model.trigger("edit:showcase");

      this.ui.showcaseMode
        .text(__("Save Showcase"))
        .addClass("btn btn-success on");

      this.ui.createShowcase.addClass("hide");
      this.ui.footerToggle.addClass("hide");
    }
  },

  setStatics: function(){
    var statics = ['project', 'profile'];

    if (statics.indexOf(hackdash.app.type) > -1){
      this.$el.addClass('static');
      return;
    }

    function isAdmin(domain){
      var user = hackdash.user;
      return user && user.admin_in.indexOf(domain) >= 0 || false;
    }

    if (hackdash.app.type === 'dashboard' && !isAdmin(this.model.get('domain')) ){
      this.$el.addClass('static');
    }
  }

});

},{"../../models/Dashboard":15,"./templates/footer.hbs":43}],43:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var stack1;
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isAdmin : depth0), {"name":"if","hash":{},"fn":this.program(2, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { return stack1; }
  else { return ''; }
  },"2":function(depth0,helpers,partials,data) {
  return "dashboard-footer";
  },"4":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isAdmin : depth0), {"name":"if","hash":{},"fn":this.program(5, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"5":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "  <div class=\"footer-dash-ctn\">\r\n\r\n\r\n    <div class=\"footer-toggle-ctn\">\r\n\r\n      <a href=\"/api/v2/dashboards/"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "/csv\" target=\"_blank\" data-bypass>\r\n        <i class=\"fa fa-download\"></i>\r\n        <div>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Export .CSV File", {"name":"__","hash":{},"data":data})))
    + "</div>\r\n      </a>\r\n\r\n      <a data-placement=\"top\" data-original-title=\""
    + escapeExpression(((helper = (helper = helpers.switcherMsg || (depth0 != null ? depth0.switcherMsg : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"switcherMsg","hash":{},"data":data}) : helper)))
    + "\"\r\n        class=\"tooltips dashboard-btn ";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.open : depth0), {"name":"if","hash":{},"fn":this.program(6, data),"inverse":this.program(8, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\">\r\n        <i class=\"txt ";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.open : depth0), {"name":"if","hash":{},"fn":this.program(10, data),"inverse":this.program(12, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\">";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.open : depth0), {"name":"if","hash":{},"fn":this.program(14, data),"inverse":this.program(16, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</i>\r\n        <div>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Dashboard Status", {"name":"__","hash":{},"data":data})))
    + "</div>\r\n      </a>\r\n\r\n    </div>\r\n\r\n    <a class=\"btn-showcase-mode\">\r\n      <i class=\"btn-danger txt\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "off", {"name":"__","hash":{},"data":data})))
    + "</i><div>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Edit Showcase", {"name":"__","hash":{},"data":data})))
    + "</div>\r\n    </a>\r\n\r\n  </div>\r\n";
},"6":function(depth0,helpers,partials,data) {
  return "dash-open";
  },"8":function(depth0,helpers,partials,data) {
  return "dash-close";
  },"10":function(depth0,helpers,partials,data) {
  return "btn-success";
  },"12":function(depth0,helpers,partials,data) {
  return "btn-danger";
  },"14":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Open", {"name":"__","hash":{},"data":data})));
  },"16":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Close", {"name":"__","hash":{},"data":data})));
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "\r\n<a class=\"brand ";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isDashboard : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\">\r\n  <div class=\"logo\"></div>\r\n  <h3>hackdash.org</h3>\r\n</a>\r\n\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isDashboard : depth0), {"name":"if","hash":{},"fn":this.program(4, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\r\n<a class=\"up-button\">\r\n  <i class=\"fa fa-long-arrow-up\"></i>\r\n  <span>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "up", {"name":"__","hash":{},"data":data})))
    + "</span>\r\n</a>\r\n";
},"useData":true});

},{"hbsfy/runtime":103}],44:[function(require,module,exports){

var
  template = require('./templates/search.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "search",
  template: template,

  ui: {
    searchbox: "#search"
  },

  events: {
    "keyup @ui.searchbox": "search",
    "click .btn-group>.btn": "sortClicked",
    "click .login": "showLogin"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  lastSearch: "",
  currentSort: "",

  initialize: function(options){
    this.showSort = (options && options.showSort) || false;
    this.collection = options && options.collection;
    this.placeholder = (options && options.placeholder) || __("Enter your keywords");
  },

  onRender: function(){
    var query = hackdash.getQueryVariable("q");
    var sort = hackdash.getQueryVariable('sort');

    if (query && query.length > 0){
      this.ui.searchbox.val(query);
      this.search();
    }

    if (sort && sort.length > 0){
      $('input[type=radio]', this.$el)
        .parents('label')
        .removeClass('active');

      $('input[type=radio]#' + sort, this.$el)
        .parents('label')
        .addClass('active');

      this.updateSort(sort);
    }
  },

  serializeData: function(){
    return _.extend({
      showSort: this.showSort,
      placeholder: this.placeholder
    }, this.model.toJSON());
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  showLogin: function(){
    hackdash.app.showLogin();
  },

  sortClicked: function(e){
    e.preventDefault();
    var val = $('input[type=radio]', e.currentTarget)[0].id;
    this.updateSort(val);
  },

  updateSort: function(sort){
    this.collection.trigger("sort:" + sort);

    if (sort !== this.currentSort){
      this.currentSort = sort;
      this.updateURL();
    }
  },

  search: function(){
    var self = this;
    window.clearTimeout(this.timer);

    this.timer = window.setTimeout(function(){
      var keyword = self.ui.searchbox.val();

      if (keyword !== self.lastSearch) {
        self.lastSearch = keyword;

        self.updateURL();
        self.collection.search(keyword);

        var top = $('#dashboard-projects').offset().top;
        var offset = self.$el.parent().height();
        var pos = (top - offset >= 0 ? top - offset : 0);
        $(window).scrollTop(pos);

        var dash = hackdash.app.dashboard;
        var domain = dash && dash.get('domain') || 'unkonwn';
        window._gaq.push(['_trackEvent', 'DashSearch', domain, keyword]);
      }

    }, 300);
  },

  updateURL: function(){
    var keywords = (this.lastSearch ? 'q=' + this.lastSearch : '');
    var sort = (this.currentSort ? 'sort=' + this.currentSort : '');

    var current = decodeURI(Backbone.history.location.search);
    var fragment = Backbone.history.fragment.replace(current, "");

    var search = '?';

    if (keywords){
      search += keywords;
    }

    if (sort){
      search += (keywords ? '&' + sort : sort);
    }

    hackdash.app.router.navigate(fragment + search);
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});

},{"./templates/search.hbs":47}],45:[function(require,module,exports){
var
    template = require('./templates/header.hbs')
  , Search = require('./Search');

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "container-fluid",
  template: template,

  regions: {
    "search": ".search-ctn"
  },

  events: {
    "click .login": "showLogin",
    "click .btn-profile": "openProfile"
  },

  modelEvents: {
    "change": "render"
  },

  templateHelpers: {
    hackdashURL: function(){
      return "//" + hackdash.baseURL;
    },
    isDashboardAdmin: function(){
      var isDashboard = (hackdash.app.type === "dashboard" ? true : false);

      var user = hackdash.user;
      return isDashboard && user && user.admin_in.indexOf(this.domain) >= 0 || false;
    }
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){

    switch(hackdash.app.type){

      case "dashboard":
        this.search.show(new Search({
          showSort: true,
          placeholder: __("Enter your keywords"),
          model: this.model,
          collection: this.collection
        }));
        break;
    }

    $('.tooltips', this.$el).tooltip({});
    this.$el.addClass(hackdash.app.type);
  },

  serializeData: function(){
    return _.extend({
      fromUrl: this.getURLFrom()
    }, this.model && this.model.toJSON() || {});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  openProfile: function(e){
    e.preventDefault();

    window.fromURL = '/' + Backbone.history.fragment;

    hackdash.app.router.navigate("/users/profile", {
      trigger: true,
      replace: true
    });
  },

  showLogin: function(){
    hackdash.app.showLogin();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  getURLFrom: function(){
    return '?from=' + window.encodeURI('/' + Backbone.history.fragment);
  }

});
},{"./Search":44,"./templates/header.hbs":46}],46:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <div class=\"pull-right col-xs-3 col-md-3\">\r\n      <a class=\"btn-profile\">\r\n        "
    + escapeExpression(((helper = (helper = helpers.getMyProfileImageHex || (depth0 != null ? depth0.getMyProfileImageHex : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"getMyProfileImageHex","hash":{},"data":data}) : helper)))
    + "\r\n      </a>\r\n      <a class=\"logout\" href=\"/logout\" data-bypass>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Log out", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n    </div>\r\n";
},"3":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <a class=\"login\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Log in", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing, escapeExpression=this.escapeExpression, buffer = "\r\n<div class=\"row main-header\">\r\n\r\n  <div class=\"hidden-xs col-sm-10 col-md-10 col-lg-10 col-sm-offset-1 col-md-offset-1 search-ctn\"></div>\r\n\r\n  <div class=\"col-xs-2 col-sm-1 col-md-1 col-lg-1 my-profile\">\r\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : helperMissing),(options={"name":"isLoggedIn","hash":{},"fn":this.program(1, data),"inverse":this.program(3, data),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isLoggedIn) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  </div>\r\n\r\n  <a class=\"logo\" href=\""
    + escapeExpression(((helper = (helper = helpers.hackdashURL || (depth0 != null ? depth0.hackdashURL : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"hackdashURL","hash":{},"data":data}) : helper)))
    + "\" data-bypass></a>\r\n\r\n</div>\r\n";
},"useData":true});

},{"hbsfy/runtime":103}],47:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<div class=\"btn-group col-xs-6 col-sm-7 col-sm-offset-1 col-md-5 col-md-offset-0 col-lg-4\" data-toggle=\"buttons\">\r\n  <label class=\"btn btn-default col-xs-4 col-md-4\">\r\n    <input type=\"radio\" name=\"options\" id=\"name\" autocomplete=\"off\"> "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "By Name", {"name":"__","hash":{},"data":data})))
    + "\r\n  </label>\r\n  <label class=\"btn btn-default col-xs-4 col-md-4 active\">\r\n    <input type=\"radio\" name=\"options\" id=\"date\" autocomplete=\"off\"> "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "By Date", {"name":"__","hash":{},"data":data})))
    + "\r\n  </label>\r\n  <label class=\"btn btn-default col-xs-4 col-md-4\">\r\n    <input type=\"radio\" name=\"options\" id=\"showcase\" autocomplete=\"off\"> "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Showcase", {"name":"__","hash":{},"data":data})))
    + "\r\n  </label>\r\n</div>\r\n\r\n<div class=\"col-sm-4 col-md-3 col-lg-4\">\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.open : depth0), {"name":"if","hash":{},"fn":this.program(2, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</div>\r\n";
},"2":function(depth0,helpers,partials,data) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing, buffer = "  <h3 class=\"create-project\">\r\n    <i class=\"fa fa-plus\"></i>\r\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : helperMissing),(options={"name":"isLoggedIn","hash":{},"fn":this.program(3, data),"inverse":this.program(5, data),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isLoggedIn) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  </h3>\r\n";
},"3":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <a href=\"/dashboards/"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "/create\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Create Project", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"5":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <a class=\"login\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Create Project", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing, buffer = "<div class=\"hidden-sm col-md-4 col-lg-4\">\r\n\r\n  <div class=\"input-group\">\r\n    <input id=\"search\" type=\"text\" class=\"form-control\" placeholder=\""
    + escapeExpression(((helper = (helper = helpers.placeholder || (depth0 != null ? depth0.placeholder : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"placeholder","hash":{},"data":data}) : helper)))
    + "\">\r\n    <span class=\"input-group-btn\">\r\n      <button class=\"btn btn-primary\" type=\"button\">\r\n        <i class=\"fa fa-search\"></i>\r\n      </button>\r\n    </span>\r\n  </div>\r\n\r\n</div>\r\n\r\n";
  stack1 = ((helper = (helper = helpers.isDashboardView || (depth0 != null ? depth0.isDashboardView : depth0)) != null ? helper : helperMissing),(options={"name":"isDashboardView","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isDashboardView) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"useData":true});

},{"hbsfy/runtime":103}],48:[function(require,module,exports){
/**
 * VIEW: A Collection of HOME Search
 *
 */

var template = require('./templates/collection.hbs');
var ItemView = require('./Item.js');

module.exports = ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'entity collection',
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  getURL: function(){
    return "/collections/" + this.model.get("_id");
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./Item.js":52,"./templates/collection.hbs":61}],49:[function(require,module,exports){
/**
 * VIEW: Counts of HOME
 *
 */

var template = require('./templates/counts.hbs');
var Counts = require('../../models/Counts');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'row counts',
  template: template,

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    this.model = new Counts();
    this.model.fetch();
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"../../models/Counts":14,"./templates/counts.hbs":62}],50:[function(require,module,exports){
/**
 * VIEW: A collection of Items for a Home Search
 *
 */

var Item = require('./Item');

module.exports = Backbone.Marionette.CollectionView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'entities',
  childView: Item,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    // option for fixed slides & not responsive (embeds)
    this.slides = options && options.slides;
  },

  onBeforeRender: function(){
    if (this.initialized && !this.$el.is(':empty')){
      this.destroySlick();
      this.$el.empty();
    }
  },

  onRender: function(){
    var self = this;
    _.defer(function(){
      self.updateGrid();
    });
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  initialized: false,
  destroyed: false,

  destroySlick: function(){
    this.$el.slick('unslick');

    var slick = this.$el.slick('getSlick');
    slick.$list.remove();
    slick.destroy();

    this.destroyed = true;
  },

  updateGrid: function(){

    if (this.initialized && !this.destroyed){
      this.destroySlick();
    }

    if (this.$el.is(':empty')){
      this.initialized = false;
      return;
    }

    var cols = this.slides;
    var responsive = [];

    if (!this.slides) {
      // is home page

      cols = 5;

      responsive = [1450, 1200, 1024, 750, 430].map(function(value){
        var cmode = false;
        if (value <= 430 ){
          cmode = true;
        }

        return {
          breakpoint: value,
          settings: {
            centerMode: cmode,
            slidesToShow: cols,
            slidesToScroll: cols--
          }
        };
      });

      cols = 6;
    }
    // else is embeds

    this.$el.slick({
      centerMode: false,
      dots: false,
      autoplay: false,
      infinite: false,
      adaptiveHeight: true,
      speed: 300,
      slidesToShow: cols,
      slidesToScroll: cols,
      responsive: responsive
    });

    this.$el
      .off('setPosition')
      .on('setPosition', this.replaceIcons.bind(this));

    this.replaceIcons();

    this.initialized = true;
    this.destroyed = false;
  },

  replaceIcons: function(){
    $('.slick-prev', this.$el).html('<i class="fa fa-chevron-left"></i>');
    $('.slick-next', this.$el).html('<i class="fa fa-chevron-right"></i>');
  }

});
},{"./Item":52}],51:[function(require,module,exports){
/**
 * VIEW: Footer
 *
 */

var template = require('./templates/footer.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'footer',
  template: template,

  ui: {
    'up': '.up-button'
  },

  events: {
    'click @ui.up': 'goTop'
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  upBlocked: false,
  goTop: function(){

    if (!this.upBlocked){
      this.upBlocked = true;

      var body = $("html, body"), self = this;
      body.animate({ scrollTop:0 }, 1500, 'swing', function() {
        self.upBlocked = false;
      });
    }
  }

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./templates/footer.hbs":63}],52:[function(require,module,exports){
/**
 * VIEW: An Item of HOME Search
 *
 */

var template = require('./templates/item.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  id: function(){ return this.model.get("_id"); },
  tagName: 'a',
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  // Overrided method by an Entity
  getURL: function(){ return false; },
  afterRender: function(){ },

  onRender: function(){

    var url = this.getURL();

    if (url !== false){
      this.$el.attr({ 'href': url });
    }

    if (hackdash.app.type === 'landing'){
      this.$el.attr({ 'data-bypass': true });
      $('.tooltips', this.$el).tooltip({ container: '.tab-content' });
    }
    else {
      $('.tooltips', this.$el).tooltip({ container: '.container' });
    }

    this.afterRender();
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./templates/item.hbs":65}],53:[function(require,module,exports){
/**
 * VIEW: Partners for HOME
 *
 */

var template = require('./templates/partners.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./templates/partners.hbs":66}],54:[function(require,module,exports){

var
  template = require('./templates/search.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "landing-search",
  template: template,

  ui: {
    searchbox: "#search"
  },

  events: {
    "keyup @ui.searchbox": "search",
    "click @ui.searchbox": "moveScroll"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  lastSearch: null,

  onRender: function(){
    var query = hackdash.getQueryVariable("q");
    if (query && query.length > 0){
      this.ui.searchbox.val(query);
      //this.lastSearch = query;
    }

    this.search();
  },

  serializeData: function(){
    return {
      showSort: this.showSort,
      placeholder: this.placeholder
    };
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  search: function(){
    var self = this;
    window.clearTimeout(this.timer);

    this.timer = window.setTimeout(function(){
      var keyword = self.ui.searchbox.val();
      var currentSearch = decodeURI(Backbone.history.location.search);
      var fragment = Backbone.history.fragment.replace(currentSearch, "");

      if (keyword !== self.lastSearch) {
        self.lastSearch = keyword;

        if (keyword.length > 0) {
          fragment = (!fragment.length ? "dashboards" : fragment);
          hackdash.app.router.navigate(fragment + "?q=" + keyword, { trigger: true });

          self.collection.fetch({
            reset: true,
            data: $.param({ q: keyword })
          });

          window._gaq.push(['_trackEvent', 'HomeSearch', fragment, keyword]);
        }
        else {
          hackdash.app.router.navigate(fragment, { trigger: true, replace: true });
          self.collection.fetch({ reset: true });
        }
      }

    }, 300);
  },

  moveScroll: function(){
    var tabs = $('.nav-tabs.landing');
    var mobileMenu = $('.mobile-menu');

    var isMobile = mobileMenu.is(':visible');

    var top = tabs.offset().top + 60;
    var offset = tabs.height();

    if (isMobile){
      top = this.ui.tabContent.offset().top;
      offset = 0;
    }

    var pos = (top - offset >= 0 ? top - offset : 0);
    
    $(window).scrollTop(pos);
  }

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});

},{"./templates/search.hbs":67}],55:[function(require,module,exports){

var template = require("./templates/stats.hbs")
  , CountsView = require("./Counts")
  /*, FeedView = require("./Feed")*/;

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "stats",
  template: template,

  regions:{
    "counts": ".counts-ctn",
    "feed": ".feed-ctn"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    this.counts.show(new CountsView());

/*
    this.feed.show(

      new FeedView({

        collection: new Backbone.Collection(
          [{
            user: {
              _id: "54909d0f7fd3d5704c0006c6",
              name: "Alvaro Graves",
              picture: "//www.gravatar.com/avatar/5d79ff6eb94d9754235c7bad525bee81?s=73"
            },
            title: "Is now a collaborator on:",
            description: "una mañana tras un sueño intranquilo Gregorio Samsa",
            created_at: "2014-12-16T20:58:55.225Z"
          },{
            user: {
              _id: "54909d0f7fd3d5704c0006c6",
              name: "Alvaro Graves",
              picture: "//www.gravatar.com/avatar/5d79ff6eb94d9754235c7bad525bee81?s=73"
            },
            title: "Is now a collaborator on:",
            description: "una mañana tras un sueño intranquilo Gregorio Samsa",
            created_at: "2014-12-16T20:58:55.225Z"
          },{
            user: {
              _id: "54909d0f7fd3d5704c0006c6",
              name: "Alvaro Graves",
              picture: "//www.gravatar.com/avatar/5d79ff6eb94d9754235c7bad525bee81?s=73"
            },
            title: "Is now a collaborator on:",
            description: "una mañana tras un sueño intranquilo Gregorio Samsa",
            created_at: "2014-12-16T20:58:55.225Z"
          },{
            user: {
              _id: "54909d0f7fd3d5704c0006c6",
              name: "Alvaro Graves",
              picture: "//www.gravatar.com/avatar/5d79ff6eb94d9754235c7bad525bee81?s=73"
            },
            title: "Is now a collaborator on:",
            description: "una mañana tras un sueño intranquilo Gregorio Samsa",
            created_at: "2014-12-16T20:58:55.225Z"
          },{
            user: {
              _id: "54909d0f7fd3d5704c0006c6",
              name: "Alvaro Graves",
              picture: "//www.gravatar.com/avatar/5d79ff6eb94d9754235c7bad525bee81?s=73"
            },
            title: "Is now a collaborator on:",
            description: "una mañana tras un sueño intranquilo Gregorio Samsa",
            created_at: "2014-12-16T20:58:55.225Z"
          },{
            user: {
              _id: "54909d0f7fd3d5704c0006c6",
              name: "Alvaro Graves",
              picture: "//www.gravatar.com/avatar/5d79ff6eb94d9754235c7bad525bee81?s=73"
            },
            title: "Is now a collaborator on:",
            description: "una mañana tras un sueño intranquilo Gregorio Samsa",
            created_at: "2014-12-16T20:58:55.225Z"
          }])

      })
    );
*/
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./Counts":49,"./templates/stats.hbs":68}],56:[function(require,module,exports){
/**
 * VIEW: HOME Tab Layout (Search header + collection)
 *
 */

var template = require("./templates/tabContent.hbs");

// Main Views
var
    Search = require("./Search")
  , EntityList = require("./EntityList")

// Item Views
  , ProjectItemView = require('../Project/Card')
  , DashboardItemView = require('../Dashboard/Card')
  , UserItemView = require('./User')
  , CollectionView = require('./Collection')

// List Views
  , ProjectList = EntityList.extend({ childView: ProjectItemView })
  , DashboardList = EntityList.extend({ childView: DashboardItemView })
  , UserList = EntityList.extend({ childView: UserItemView })
  , CollectionList = EntityList.extend({ childView: CollectionView })

// Collection models
  , Projects = require('../../models/Projects')
  , Dashboards = require('../../models/Dashboards')
  , Collections = require('../../models/Collections')
  , Users = require('../../models/Users');

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  ui: {
    "loading": '.loading'
  },

  regions: {
    "header": ".header",
    "content": ".content-place"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    var self = this;

    function showLoading(){
      self.ui.loading.removeClass('hidden');
    }

    this.collection.on('fetch', showLoading);

    this.collection.on('reset', function(){
      self.ui.loading.addClass('hidden');
      self.collection.off('fetch', showLoading);
    });
  },

  onRender: function(){

    if (!this.header.currentView){

      this.header.show(new Search({
        collection: this.collection
      }));

      var ListView;
      if(this.collection instanceof Projects){
        ListView = ProjectList;
      }
      else if(this.collection instanceof Dashboards){
        ListView = DashboardList;
      }
      else if(this.collection instanceof Collections){
        ListView = CollectionList;
      }
      else if(this.collection instanceof Users){
        ListView = UserList;
      }

      this.content.show(new ListView({
        collection: this.collection
      }));

    }

  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"../../models/Collections":13,"../../models/Dashboards":16,"../../models/Projects":19,"../../models/Users":22,"../Dashboard/Card":28,"../Project/Card":83,"./Collection":48,"./EntityList":50,"./Search":54,"./User":59,"./templates/tabContent.hbs":69}],57:[function(require,module,exports){
/**
 * VIEW: A Team for Home
 *
 */

var User = require('./TeamUser');

module.exports = Backbone.Marionette.CollectionView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  childView: User,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./TeamUser":58}],58:[function(require,module,exports){
/**
 * VIEW: A User Team of HOME
 *
 */

var template = require('./templates/user.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'team-user',
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./templates/user.hbs":70}],59:[function(require,module,exports){
/**
 * VIEW: An Dashboard of HOME Search
 *
 */

var template = require('./templates/user.hbs');
var ItemView = require('./Item.js');

module.exports = ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'entity user',
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  getURL: function(){
    return "/users/" + this.model.get("_id");
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./Item.js":52,"./templates/user.hbs":70}],60:[function(require,module,exports){

var template = require("./templates/home.hbs")
  , TabContent = require("./TabContent")
  , LoginView = require("../Login")
  , StatsView = require("./Stats")
  , TeamView = require("./Team")
  , PartnersView = require("./Partners")
  , FooterView = require("./Footer")

  // Collections
  , Dashboards = require("../../models/Dashboards")
  , Projects = require("../../models/Projects")
  , Users = require("../../models/Users")
  , Collections = require("../../models/Collections")
  , Team = require("../../models/Team");

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  regions:{
    "dashboards": "#dashboards",
    "projects": "#projects",
    "users": "#users",
    "collections": "#collections",

    "stats": ".stats-ctn",
    "team": ".team-ctn",
    "partners": ".partners-ctn",
    "footer": ".footer-ctn",
  },

  ui: {
    "domain": "#domain",
    "create": "#create-dashboard",
    "errorHolder": "#new-dashboard-error",

    "dashboards": "#dashboards",
    "projects": "#projects",
    "users": "#users",
    "collections": "#collections",

    "tabs": ".nav-tabs.landing",
    "mobileMenu": ".mobile-menu",
    "tabContent": ".tab-content"
  },

  events: {
    "keyup @ui.domain": "validateDomain",
    "click @ui.domain": "checkLogin",
    "click @ui.create": "createDashboard",
    "click .up-button": "goTop",
    "click @ui.mobileMenu": "toggleMobileMenu",
    "click .continue": "clickContiune"
  },

  lists: {
    projects: null,
    dashboards: null,
    users: null,
    collections: null
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.section = (options && options.section) || "dashboards";

    this.hdTeam = new Team();
    this.hdTeam.fetch();
  },

  onRender: function(){

    this.changeTab();

    if (!this.ui[this.section].hasClass("active")){
      this.ui[this.section].addClass("active");
    }

    this.stats.show(new StatsView());

    this.team.show(new TeamView({ collection: this.hdTeam }));
    this.partners.show(new PartnersView());

    this.footer.show(new FooterView());

    var self = this;
    _.defer(function(){
      if (self.ui.mobileMenu.is(':visible')){
        self.ui.tabs.addClass('hidden');
      }
    });
  },

  getNewList: function(type){
    switch(type){
      case "dashboards": return new Dashboards();
      case "projects": return new Projects();
      case "users": return new Users();
      case "collections": return new Collections();
    }
  },

  changeTab: function(){

    if (!this[this.section].currentView){

      this.lists[this.section] =
        this.lists[this.section] || this.getNewList(this.section);

      this[this.section].show(new TabContent({
        collection: this.lists[this.section]
      }));
    }

    this.ui[this.section].tab("show");

    if (this.ui.mobileMenu.is(':visible')){
      this.ui.tabs.addClass('hidden');
    }
  },

  toggleMobileMenu: function(){
    if (this.ui.mobileMenu.is(':visible')){
      if (this.ui.tabs.hasClass('hidden')){
        this.ui.tabs.removeClass('hidden');
      }
      else {
        this.ui.tabs.addClass('hidden');
      }
    }
  },

  clickContiune: function(){
    this.animateScroll(true);
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  setSection: function(section){
    this.section = section;
    this.changeTab();
    this.animateScroll();
  },

  errors: {
    "subdomain_invalid": __("5 to 10 chars, no spaces or special"),
    "subdomain_inuse": __("Sorry, that one is in use. Try another one.")
  },

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  checkLogin: function(){
    if (window.hackdash.user){
      return true;
    }

    var providers = window.hackdash.providers;
    var app = window.hackdash.app;

    app.modals.show(new LoginView({
      model: new Backbone.Model({ providers: providers.split(',') })
    }));

    return false;
  },

  validateDomain: function(){
    if (this.checkLogin()){
      var name = this.ui.domain.val();
      this.cleanErrors();

      if(/^[a-z0-9]{5,10}$/.test(name)) {
        this.cleanErrors();
      } else {
        this.ui.errorHolder
          .removeClass('hidden')
          .text(this.errors.subdomain_invalid);
      }
    }
  },

  createDashboard: function(){
    if (this.checkLogin()){
      var domain = this.ui.domain.val();

      this.cleanErrors();

      this.ui.create.button('loading');

      var dash = new Dashboards([]);

      dash.create({ domain: domain }, {
        success: this.redirectToSubdomain.bind(this, domain),
        error: this.showError.bind(this)
      });
    }
  },

  showError: function(view, err){
    this.ui.create.button('reset');

    if (err.responseText === "OK"){
      this.redirectToSubdomain(this.ui.domain.val());
      return;
    }

    var error = JSON.parse(err.responseText).error;
    this.ui.errorHolder
      .removeClass('hidden')
      .text(this.errors[error]);
  },

  cleanErrors: function(){
    this.ui.errorHolder.addClass('hidden').text('');
  },

  goTop: function(){
    this.footer.currentView.goTop();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  animateScroll: function(animate){
    if (this.section){

      var isMobile = this.ui.mobileMenu.is(':visible');

      var top = this.ui.tabs.offset().top + 60;
      var offset = this.ui.tabs.height();

      if (isMobile){
        top = this.ui.tabContent.offset().top;
        offset = 0;
      }

      var pos = (top - offset >= 0 ? top - offset : 0);

      if (animate){
        $("html, body").animate({ scrollTop: pos }, 1500, 'swing');
        return;
      }

      $(window).scrollTop(pos);
    }
  },

  redirectToSubdomain: function(name){
    window.location = '/dashboards/' + name;
  },

  isEnterKey: function(e){
    var key = e.keyCode || e.which;
    return (key === 13);
  }

});

},{"../../models/Collections":13,"../../models/Dashboards":16,"../../models/Projects":19,"../../models/Team":20,"../../models/Users":22,"../Login":71,"./Footer":51,"./Partners":53,"./Stats":55,"./TabContent":56,"./Team":57,"./templates/home.hbs":64}],61:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <i class=\"item-letter\">"
    + escapeExpression(((helpers.firstLetter || (depth0 && depth0.firstLetter) || helperMissing).call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"firstLetter","hash":{},"data":data})))
    + "</i>\r\n";
},"3":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <i class=\"item-letter\">"
    + escapeExpression(((helpers.firstLetter || (depth0 && depth0.firstLetter) || helperMissing).call(depth0, (depth0 != null ? depth0.domain : depth0), {"name":"firstLetter","hash":{},"data":data})))
    + "</i>\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, lambda=this.lambda, buffer = "<div class=\"cover\">\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.program(3, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</div>\r\n\r\n<div class=\"details\">\r\n  <div>\r\n    <h2>"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</h2>\r\n    <h3 class=\"description\">\r\n      "
    + escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"description","hash":{},"data":data}) : helper)))
    + "\r\n    </h3>\r\n  </div>\r\n</div>\r\n\r\n<div class=\"action-bar text-center\">\r\n  <i class=\"fa fa-clock-o timer\" title=\""
    + escapeExpression(((helpers.timeAgo || (depth0 && depth0.timeAgo) || helperMissing).call(depth0, (depth0 != null ? depth0.created_at : depth0), {"name":"timeAgo","hash":{},"data":data})))
    + "\"></i>\r\n  <span>"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.dashboards : depth0)) != null ? stack1.length : stack1), depth0))
    + " "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Dashboards", {"name":"__","hash":{},"data":data})))
    + "</span>\r\n  <!--<span>Likes 00</span>\r\n  <a>Share</a>-->\r\n</div>";
},"useData":true});

},{"hbsfy/runtime":103}],62:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<div class=\"col-xs-6 col-sm-4 col-md-4 group\">\r\n  <div class=\"dashboard\">\r\n    <h5>"
    + escapeExpression(((helper = (helper = helpers.dashboards || (depth0 != null ? depth0.dashboards : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"dashboards","hash":{},"data":data}) : helper)))
    + "</h5>\r\n    <h6>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "dashboards", {"name":"__","hash":{},"data":data})))
    + "</h6>\r\n  </div>\r\n  <div class=\"project\">\r\n    <h5>"
    + escapeExpression(((helper = (helper = helpers.projects || (depth0 != null ? depth0.projects : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"projects","hash":{},"data":data}) : helper)))
    + "</h5>\r\n    <h6>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "projects", {"name":"__","hash":{},"data":data})))
    + "</h6>\r\n  </div>\r\n</div>\r\n<div class=\"col-xs-6 col-sm-4 col-md-4 group\">\r\n  <div class=\"user\">\r\n    <h5>"
    + escapeExpression(((helper = (helper = helpers.users || (depth0 != null ? depth0.users : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"users","hash":{},"data":data}) : helper)))
    + "</h5>\r\n    <h6>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "registered users", {"name":"__","hash":{},"data":data})))
    + "</h6>\r\n  </div>\r\n  <div class=\"collection\">\r\n    <h5>"
    + escapeExpression(((helper = (helper = helpers.collections || (depth0 != null ? depth0.collections : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"collections","hash":{},"data":data}) : helper)))
    + "</h5>\r\n    <h6>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "collections", {"name":"__","hash":{},"data":data})))
    + "</h6>\r\n  </div>\r\n</div>\r\n<div class=\"col-xs-12 col-sm-4 col-md-4 project releases\">\r\n  <h5>"
    + escapeExpression(((helper = (helper = helpers.releases || (depth0 != null ? depth0.releases : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"releases","hash":{},"data":data}) : helper)))
    + "</h5>\r\n  <h6>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "released projects", {"name":"__","hash":{},"data":data})))
    + "</h6>\r\n</div>";
},"useData":true});

},{"hbsfy/runtime":103}],63:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<a class=\"brand\">\r\n  <div class=\"logo\"></div>\r\n  <h3>hackdash.org</h3>\r\n</a>\r\n<a class=\"up-button\">\r\n  <i class=\"fa fa-long-arrow-up\"></i>\r\n  <span>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "up", {"name":"__","hash":{},"data":data})))
    + "</span>\r\n</a>";
},"useData":true});

},{"hbsfy/runtime":103}],64:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "\r\n<div class=\"landing-header\">\r\n\r\n  <div class=\"text-vcenter call-action\">\r\n\r\n    <div class=\"logo\"></div>\r\n\r\n    <h1>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Ideas for a", {"name":"__","hash":{},"data":data})))
    + " <span class=\"highlight\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "hackathon", {"name":"__","hash":{},"data":data})))
    + "</span></h1>\r\n\r\n    <div class=\"container-fluid\">\r\n\r\n      <div class=\"row\">\r\n\r\n        <div class=\"col-xs-12\">\r\n          <div class=\"input-group\">\r\n            <input id=\"domain\" type=\"text\" class=\"form-control\" placeholder='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "dashboard name (5-10 chars)", {"name":"__","hash":{},"data":data})))
    + "'>\r\n            <span class=\"input-group-btn\">\r\n              <button id=\"create-dashboard\" class=\"btn btn-primary\" type=\"button\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "create now", {"name":"__","hash":{},"data":data})))
    + "</button>\r\n            </span>\r\n          </div>\r\n          <p id=\"new-dashboard-error\" class=\"text-center text-danger hidden\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "ERROR", {"name":"__","hash":{},"data":data})))
    + "</p>\r\n        </div>\r\n\r\n      </div>\r\n\r\n      <div class=\"row\">\r\n        <div class=\"col-xs-12\">\r\n          <a class=\"continue\">\r\n            <i class=\"fa fa-angle-down\"></i>\r\n          </a>\r\n        </div>\r\n      </div>\r\n\r\n    </div>\r\n\r\n  </div>\r\n\r\n</div>\r\n\r\n<div class=\"container-fluid\">\r\n  <div class=\"row\">\r\n    <div class=\"col-md-12 text-center\">\r\n\r\n      <a class=\"btn btn-default mobile-menu visible-xs\">\r\n        <i class=\"fa fa-align-justify\"></i>\r\n      </a>\r\n\r\n      <ul class=\"nav nav-tabs landing\" role=\"tablist\">\r\n\r\n        <li id=\"collection\" class=\"collection\">\r\n          <a href=\"#collections\" role=\"tab\" data-toggle=\"tab\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Collections", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n        </li>\r\n        <li id=\"dashboard\" class=\"dashboard\">\r\n          <a href=\"#dashboards\" role=\"tab\" data-toggle=\"tab\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Dashboards", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n        </li>\r\n        <li id=\"project\" class=\"project\">\r\n          <a href=\"#projects\" role=\"tab\" data-toggle=\"tab\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Projects", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n        </li>\r\n        <li id=\"user\" class=\"user\">\r\n          <a href=\"#users\" role=\"tab\" data-toggle=\"tab\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "People", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n        </li>\r\n\r\n      </ul>\r\n\r\n    </div>\r\n  </div>\r\n</div>\r\n\r\n<div class=\"tab-content\">\r\n  <div role=\"tabpanel\" class=\"tab-pane\" id=\"dashboards\"></div>\r\n  <div role=\"tabpanel\" class=\"tab-pane\" id=\"projects\"></div>\r\n  <div role=\"tabpanel\" class=\"tab-pane\" id=\"users\"></div>\r\n  <div role=\"tabpanel\" class=\"tab-pane\" id=\"collections\"></div>\r\n</div>\r\n\r\n<div class=\"col-md-12 stats-ctn\"></div>\r\n\r\n<h3 class=\"team-tab visible-xs\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "team", {"name":"__","hash":{},"data":data})))
    + "</h3>\r\n<div class=\"col-md-12 team-ctn\"></div>\r\n\r\n<div class=\"team-partners hidden-xs\">\r\n  <div class=\"col-sm-5 col-sm-offset-1 col-md-3 col-md-offset-3 col-lg-2 col-lg-offset-4 partners-tab\">\r\n    <h3>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "partners", {"name":"__","hash":{},"data":data})))
    + "</h3>\r\n  </div>\r\n  <div class=\"col-sm-5 col-md-3 col-lg-2 team-tab\">\r\n    <h3>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "team", {"name":"__","hash":{},"data":data})))
    + "</h3>\r\n  </div>\r\n</div>\r\n\r\n<h3 class=\"partners-tab visible-xs\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "partners", {"name":"__","hash":{},"data":data})))
    + "</h3>\r\n<div class=\"col-md-12 partners-ctn\"></div>\r\n\r\n<div class=\"col-md-12 about-ctn\">\r\n  ";
  stack1 = ((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "The HackDash was born", {"name":"__","hash":{},"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\r\n\r\n</div>\r\n<div class=\"col-md-12 footer-ctn\"></div>\r\n";
},"useData":true});

},{"hbsfy/runtime":103}],65:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<div>"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "</div>";
},"useData":true});

},{"hbsfy/runtime":103}],66:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  return "<ul>\r\n  <li class=\"hackshackers\"></li>\r\n  <li class=\"hackslabs\"></li>\r\n  <li class=\"ICFJ\"></li>\r\n  <li class=\"hivos\"></li>\r\n  <li class=\"vurbia\"></li>\r\n</ul>";
  },"useData":true});

},{"hbsfy/runtime":103}],67:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<div class=\"row\">\r\n\r\n  <div class=\"hidden-xs col-sm-3 col-md-4\">\r\n\r\n    <div class=\"col-sm-12 col-md-6\">\r\n\r\n      <div class=\"media\">\r\n        <div class=\"media-left\">\r\n          <i class=\"fa fa-tasks\"></i>\r\n        </div>\r\n        <div class=\"media-body\">\r\n          "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Inform Progress to community.", {"name":"__","hash":{},"data":data})))
    + "\r\n        </div>\r\n      </div>\r\n\r\n    </div>\r\n    <div class=\"col-sm-12 col-md-6\">\r\n\r\n      <div class=\"media\">\r\n        <div class=\"media-left\">\r\n          <i class=\"fa fa-cloud-upload\"></i>\r\n        </div>\r\n        <div class=\"media-body\">\r\n          "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Upload your project to the platform.", {"name":"__","hash":{},"data":data})))
    + "\r\n        </div>\r\n      </div>\r\n\r\n    </div>\r\n\r\n  </div>\r\n\r\n  <div class=\"col-xs-12 col-sm-6 col-md-4\">\r\n    <div class=\"input-group\">\r\n      <input id=\"search\" type=\"text\" class=\"form-control\" placeholder='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "enter keywords", {"name":"__","hash":{},"data":data})))
    + "'>\r\n      <span class=\"input-group-btn\">\r\n        <button class=\"btn btn-primary\" type=\"button\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "find it", {"name":"__","hash":{},"data":data})))
    + "</button>\r\n      </span>\r\n    </div>\r\n  </div>\r\n\r\n  <div class=\"hidden-xs col-sm-3 col-md-4\">\r\n\r\n    <div class=\"col-sm-12 col-md-6\">\r\n\r\n      <div class=\"media\">\r\n        <div class=\"media-left\">\r\n          <i class=\"fa fa-user-plus\"></i>\r\n        </div>\r\n        <div class=\"media-body\">\r\n          "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Add Collaborators to your projects.", {"name":"__","hash":{},"data":data})))
    + "\r\n        </div>\r\n      </div>\r\n\r\n    </div>\r\n    <div class=\"col-sm-12 col-md-6\">\r\n\r\n      <div class=\"media\">\r\n        <div class=\"media-left\">\r\n          <i class=\"fa fa-share-alt\"></i>\r\n        </div>\r\n        <div class=\"media-body\">\r\n          "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Share your app to the world.", {"name":"__","hash":{},"data":data})))
    + "\r\n        </div>\r\n      </div>\r\n\r\n    </div>\r\n\r\n  </div>\r\n\r\n</div>";
},"useData":true});

},{"hbsfy/runtime":103}],68:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  return "<div class=\"col-md-12 counts-ctn\"></div>\r\n<div class=\"col-md-6 feed-ctn hidden\"></div>";
  },"useData":true});

},{"hbsfy/runtime":103}],69:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<div class=\"container-fluid header\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "HEAD", {"name":"__","hash":{},"data":data})))
    + "</div>\r\n<div class=\"content\">\r\n  <div class=\"content-place\"></div>\r\n  <div class=\"loading hidden\">\r\n    <i class=\"fa fa-spinner fa-pulse\"></i>\r\n  </div>\r\n</div>";
},"useData":true});

},{"hbsfy/runtime":103}],70:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<a href=\"/users/"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "\" data-bypass>\r\n  <div class=\"cover\">\r\n    <div class=\"item-letter\">\r\n      "
    + escapeExpression(((helpers.getProfileImageHex || (depth0 && depth0.getProfileImageHex) || helperMissing).call(depth0, depth0, {"name":"getProfileImageHex","hash":{},"data":data})))
    + "\r\n    </div>\r\n  </div>\r\n\r\n  <div class=\"details\">\r\n    <h2>"
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "</h2>\r\n    <div class=\"description\">"
    + escapeExpression(((helper = (helper = helpers.bio || (depth0 != null ? depth0.bio : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"bio","hash":{},"data":data}) : helper)))
    + "</div>\r\n  </div>\r\n</a>";
},"useData":true});

},{"hbsfy/runtime":103}],71:[function(require,module,exports){
/**
 * VIEW: Login Modal
 *
 */

var template = require('./templates/login.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "login",
  template: template,

  events: {
    "click .close": "destroy"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  templateHelpers: {
    redirectURL: function(){
      var url = hackdash.app.previousURL || '';
      return (url.length ? '?redirect=' + url : url);
    }
  }

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./templates/login.hbs":93}],72:[function(require,module,exports){
/**
 * VIEW: Login Modal
 *
 */

var template = require('./templates/messageBox.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "message-box",
  template: template,

  events: {
    "click .ok": "destroy",
    "click .close": "destroy"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./templates/messageBox.hbs":94}],73:[function(require,module,exports){
/**
 * REGION: ModalRegion
 * Used to manage Twitter Bootstrap Modals with Backbone Marionette Views
 */

module.exports = Backbone.Marionette.Region.extend({
  el: "#modals-container",

  constructor: function(){
    Backbone.Marionette.Region.prototype.constructor.apply(this, arguments);
    this.on("show", this.showModal, this);
  },

  getEl: function(selector){
    var $el = $(selector);
    $el.on("hidden", this.destroy);
    return $el;
  },

  showModal: function(view){
    view.on("destroy", this.hideModal, this);
    this.$el.parents('.modal').modal('show');
  },

  hideModal: function(){
    this.$el.parents('.modal').modal('hide');
  }

});

},{}],74:[function(require,module,exports){
/**
 * VIEW: ProfileCard
 *
 */

var template = require('./templates/card.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  events: {
    "click .login": "showLogin"
  },

  modelEvents:{
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  showLogin: function(){
    hackdash.app.showLogin();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./templates/card.hbs":79}],75:[function(require,module,exports){
/**
 * VIEW: ProfileCard Edit
 *
 */

var template = require('./templates/cardEdit.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  ui: {
    "name": "input[name=name]",
    "email": "input[name=email]",
    "bio": "textarea[name=bio]",
  },

  events: {
    "click #save": "saveProfile",
    "click #cancel": "cancel"
  },

  modelEvents:{
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  saveProfile: function(){
    var toSave = {};

    _.each(this.ui, function(ele, type){
      toSave[type] = ele.val();
    }, this);

    this.cleanErrors();

    $("#save", this.$el).button('loading');

    this.model
      .save(toSave, { patch: true, silent: true })
      .error(this.showError.bind(this));
  },

  cancel: function(){
    this.exit();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  errors: {
    "name_required": __("Name is required"),
    "email_required": __("Email is required"),
    "email_invalid": __("Invalid Email")
  },

  exit: function(){
    window.fromURL = window.fromURL || window.hackdash.getQueryVariable('from') || '';

    if (window.fromURL){
      hackdash.app.router.navigate(window.fromURL, {
        trigger: true,
        replace: true
      });

      window.fromURL = "";
      return;
    }

    window.location = "/";
  },

  showError: function(err){
    $("#save", this.$el).button('reset');

    if (err.responseText === "OK"){

      $('#cancel').addClass('hidden');
      $('#save').addClass('hidden');
      $(".saved", this.$el).removeClass('hidden').addClass('show');

      window.clearTimeout(this.timer);
      this.timer = window.setTimeout(this.exit.bind(this), 2000);

      return;
    }

    var error = JSON.parse(err.responseText).error;

    var ctrl = error.split("_")[0];
    this.ui[ctrl].parents('.control-group').addClass('error');
    this.ui[ctrl].after('<span class="help-inline">' + this.errors[error] + '</span>');
  },

  cleanErrors: function(){
    $(".error", this.$el).removeClass("error");
    $("span.help-inline", this.$el).remove();
  }

});
},{"./templates/cardEdit.hbs":80}],76:[function(require,module,exports){
/**
 * VIEW: Profile list (collection, dashboard, project)
 *
 */

var Item = require('./ListItem');

module.exports = Backbone.Marionette.CollectionView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  tagName: "ul",
  childView: Item,

  childViewOptions: function() {
    return {
      type: this.type,
      isMyProfile: this.isMyProfile
    };
  },

  showAll: true,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.fullList = options.collection || new Backbone.Collection();
    this.type = (options && options.type) || false;
    this.isMyProfile = (options && options.isMyProfile) || false;
  },

  onBeforeRender: function(){
    if (Array.isArray(this.fullList)){
      this.fullList = new Backbone.Collection(this.fullList);
    }

    this.collection = this.fullList;
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./ListItem":77}],77:[function(require,module,exports){
/**
 * VIEW: Profile Item List
 *
 */

var template = require('./templates/listItem.hbs'),
  Dashboard = require('../../models/Dashboard');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  tagName: "li",
  template: template,

  events: {
    "click .remove-entity": "removeEntity"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.type = (options && options.type) || "projects";
    this.isMyProfile = (options && options.isMyProfile) || false;
  },

  serializeData: function(){
    var url,
      isProject = false,
      showDelete = false;

    switch(this.type){
      case "collections":
        url = "/collections/" + this.model.get("_id");
        break;
      case "dashboards":
        url = "/dashboards/" + this.model.get("domain");
        showDelete = this.isMyProfile && Dashboard.isAdmin(this.model);
        break;
      case "projects":
      case "contributions":
      case "likes":
        url = "/projects/" + this.model.get("_id");
        isProject = true;
        break;
    }

    var showImage = (this.type === "collections" || this.type === "dashboards" ? false : true);
    if (showImage){
      showImage = this.model.get('cover');
    }

    return _.extend({
      showImage: showImage,
      isProject: isProject,
      showDelete: showDelete,
      type: this.type,
      url: url
    }, this.model.toJSON());
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  removeEntity: function(e){
    if (this.type !== "dashboards"){
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (!Dashboard.isAdmin(this.model)){
      this.showMessage(__("Only the Owner can remove this Dashboard."));
      return;
    }

    if (!Dashboard.isOwner(this.model)){
      this.showMessage(__("Only Dashboards with ONE admin can be removed."));
      return;
    }

    if (this.model.get(__("projectsCount")) > 0){
      this.showMessage(__("Only Dashboards without Projects can be removed."));
      return;
    }

    if (window.confirm(__('This action will remove Dashboard ') +
      this.model.get("domain") + __('. Are you sure?'))){

        var dash = new Dashboard({ domain: this.model.get('domain') });
        dash.destroy().done(function(){
          window.location.reload();
        });
    }
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  showMessage: function(msg){
    hackdash.app.showOKMessage({
      title: __("cannot_remove_dashboard", this.model.get('domain')),
      message: msg,
      type: "danger"
    });
  }

});

},{"../../models/Dashboard":15,"./templates/listItem.hbs":81}],78:[function(require,module,exports){

var
    template = require("./templates/profile.hbs")
  , ProfileCard = require("./Card")
  , ProfileCardEdit = require("./CardEdit")
  , EntityList = require("./EntityList");

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "page-ctn profile",
  template: template,

  regions: {
    "profileCard": ".profile-card",

    "collections": "#collections",
    "dashboards": "#dashboards",
    "projects": "#projects",
    "contributions": "#contributions",
    "likes": "#likes",
  },

  ui: {
    "collections": "#collections",
    "dashboards": "#dashboards",
    "projects": "#projects",
    "contributions": "#contributions",
    "likes": "#likes",
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.section = (options && options.section) || "dashboards";
    this.isMyProfile = (hackdash.user && this.model.get("_id") === hackdash.user._id ? true : false);
  },

  onRender: function(){

    this.changeTab();

    if (!this.ui[this.section].hasClass("active")){
      this.ui[this.section].addClass("active");
    }

    if (this.isMyProfile){
      this.profileCard.show(new ProfileCardEdit({
        model: this.model
      }));
    }
    else {
      this.profileCard.show(new ProfileCard({
        model: this.model
      }));
    }

    $('.tooltips', this.$el).tooltip({});

    $('a[data-toggle="tab"]', this.$el).on('shown.bs.tab', this.setSection.bind(this));
    $('html, body').scrollTop(0);
  },

  changeTab: function(){
    if (!this[this.section].currentView){

      this[this.section].show(new EntityList({
        collection: this.model.get(this.section),
        type: this.section,
        isMyProfile: this.isMyProfile
      }));
    }

    this.ui[this.section].tab("show");
  },

  setSection: function(e){
    this.section = e.target.parentElement.id + 's';
    this.changeTab();
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./Card":74,"./CardEdit":75,"./EntityList":76,"./templates/profile.hbs":82}],79:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <p>"
    + escapeExpression(((helper = (helper = helpers.email || (depth0 != null ? depth0.email : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"email","hash":{},"data":data}) : helper)))
    + "</p>\r\n";
},"3":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <p><a class=\"login\" style=\"color: #A8A8A8;\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "[ Log in to reveal e-mail ]", {"name":"__","hash":{},"data":data})))
    + "</a></p>\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", blockHelperMissing=helpers.blockHelperMissing, buffer = "<div class=\"cover\">"
    + escapeExpression(((helpers.getProfileImageHex || (depth0 && depth0.getProfileImageHex) || helperMissing).call(depth0, depth0, {"name":"getProfileImageHex","hash":{},"data":data})))
    + "</div>\r\n<h1 class=\"header\">"
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "</h1>\r\n<div class=\"profileInfo\">\r\n\r\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : helperMissing),(options={"name":"isLoggedIn","hash":{},"fn":this.program(1, data),"inverse":this.program(3, data),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isLoggedIn) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\r\n  <p>"
    + escapeExpression(((helper = (helper = helpers.bio || (depth0 != null ? depth0.bio : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"bio","hash":{},"data":data}) : helper)))
    + "</p>\r\n</div>\r\n";
},"useData":true});

},{"hbsfy/runtime":103}],80:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "      <label class=\"email-info\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "email only visible for logged in users", {"name":"__","hash":{},"data":data})))
    + "</label>\r\n";
},"3":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <a id=\"cancel\" class=\"btn-cancel pull-left\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "cancel", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", buffer = "<h1 class=\"header edit\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Edit Your Profile", {"name":"__","hash":{},"data":data})))
    + "</h1>\r\n\r\n<div class=\"cover\">"
    + escapeExpression(((helpers.getProfileImageHex || (depth0 && depth0.getProfileImageHex) || helperMissing).call(depth0, depth0, {"name":"getProfileImageHex","hash":{},"data":data})))
    + "</div>\r\n\r\n<form>\r\n  <div class=\"form-content\">\r\n    <label class=\"profile-fields-required\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "all fields required", {"name":"__","hash":{},"data":data})))
    + "</label>\r\n    <div class=\"form-group\">\r\n      <input name=\"name\" type=\"text\" placeholder=\"Name\" value=\""
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\" class=\"form-control\"/>\r\n    </div>\r\n    <div class=\"form-group\">\r\n      <input name=\"email\" type=\"text\" placeholder=\"Email\" value=\""
    + escapeExpression(((helper = (helper = helpers.email || (depth0 != null ? depth0.email : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"email","hash":{},"data":data}) : helper)))
    + "\" class=\"form-control\"/>\r\n";
  stack1 = helpers.unless.call(depth0, (depth0 != null ? depth0.email : depth0), {"name":"unless","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "    </div>\r\n    <div class=\"form-group\">\r\n      <textarea name=\"bio\" placeholder='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Some about you", {"name":"__","hash":{},"data":data})))
    + "' class=\"form-control\" rows=\"4\">"
    + escapeExpression(((helper = (helper = helpers.bio || (depth0 != null ? depth0.bio : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"bio","hash":{},"data":data}) : helper)))
    + "</textarea>\r\n    </div>\r\n  </div>\r\n  <div class=\"form-actions\">\r\n    <input id=\"save\" type=\"button\" data-loading-text='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "saving...", {"name":"__","hash":{},"data":data})))
    + "' value='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Save profile", {"name":"__","hash":{},"data":data})))
    + "' class=\"btn-primary pull-right\"/>\r\n    <label class=\"saved pull-left hidden\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Profile saved, going back to business ...", {"name":"__","hash":{},"data":data})))
    + "</label>\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.email : depth0), {"name":"if","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  </div>\r\n</form>";
},"useData":true});

},{"hbsfy/runtime":103}],81:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <div class=\"progress\" title=\""
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\">\r\n          <div class=\"progress-bar progress-bar-success progress-bar-striped "
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\" role=\"progressbar\">\r\n          </div>\r\n        </div>\r\n";
},"3":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <img src=\""
    + escapeExpression(((helper = (helper = helpers.cover || (depth0 != null ? depth0.cover : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"cover","hash":{},"data":data}) : helper)))
    + "\" style=\"width: 64px; height: 64px;\">\r\n";
},"5":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <i class=\"item-letter\">"
    + escapeExpression(((helpers.firstLetter || (depth0 && depth0.firstLetter) || helperMissing).call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"firstLetter","hash":{},"data":data})))
    + "</i>\r\n";
},"7":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <button class=\"remove-entity pull-right\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Remove", {"name":"__","hash":{},"data":data})))
    + "</button>\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<a class=\""
    + escapeExpression(((helper = (helper = helpers.type || (depth0 != null ? depth0.type : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"type","hash":{},"data":data}) : helper)))
    + "\" href=\""
    + escapeExpression(((helper = (helper = helpers.url || (depth0 != null ? depth0.url : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"url","hash":{},"data":data}) : helper)))
    + "\">\r\n  <div class=\"well media\">\r\n    <div class=\"media-left\">\r\n\r\n      <div class=\"cover\">\r\n\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isProject : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.showImage : depth0), {"name":"if","hash":{},"fn":this.program(3, data),"inverse":this.program(5, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n      </div>\r\n\r\n    </div>\r\n\r\n    <div class=\"media-body\">\r\n\r\n      <h4 class=\"media-heading\">"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</h4>\r\n      <p>"
    + escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"description","hash":{},"data":data}) : helper)))
    + "</p>\r\n\r\n    </div>\r\n\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.showDelete : depth0), {"name":"if","hash":{},"fn":this.program(7, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  </div>\r\n</a>";
},"useData":true});

},{"hbsfy/runtime":103}],82:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;
  return "        <li id=\"collection\" class=\"collection\">\r\n          <a href=\"#collections\" role=\"tab\" data-toggle=\"tab\" data-bypass=\"true\">\r\n            <span class=\"coll-length\">"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.collections : depth0)) != null ? stack1.length : stack1), depth0))
    + "</span>\r\n            <h3>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Collections", {"name":"__","hash":{},"data":data})))
    + "</h3>\r\n          </a>\r\n        </li>\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = "\r\n<div class=\"header\">\r\n  <div class=\"container\">\r\n\r\n    <div class=\"profile-card\"></div>\r\n\r\n    <div class=\"text-center\">\r\n\r\n      <ul class=\"nav nav-tabs\" role=\"tablist\">\r\n\r\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.collections : depth0)) != null ? stack1.length : stack1), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\r\n        <li id=\"dashboard\" class=\"dashboard\">\r\n          <a href=\"#dashboards\" role=\"tab\" data-toggle=\"tab\" data-bypass=\"true\">\r\n            <span class=\"dash-length\">"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.dashboards : depth0)) != null ? stack1.length : stack1), depth0))
    + "</span>\r\n            <h3>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Dashboards", {"name":"__","hash":{},"data":data})))
    + "</h3>\r\n          </a>\r\n        </li>\r\n        <li id=\"project\" class=\"project\">\r\n          <a href=\"#projects\" role=\"tab\" data-toggle=\"tab\" data-bypass=\"true\">\r\n            <span class=\"proj-length\">"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.projects : depth0)) != null ? stack1.length : stack1), depth0))
    + "</span>\r\n            <h3>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Projects", {"name":"__","hash":{},"data":data})))
    + "</h3>\r\n          </a>\r\n        </li>\r\n        <li id=\"contribution\" class=\"contributions\">\r\n          <a href=\"#contributions\" role=\"tab\" data-toggle=\"tab\" data-bypass=\"true\">\r\n            <span class=\"contrib-length\">"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.contributions : depth0)) != null ? stack1.length : stack1), depth0))
    + "</span>\r\n            <h3>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Contributions", {"name":"__","hash":{},"data":data})))
    + "</h3>\r\n          </a>\r\n        </li>\r\n        <li id=\"like\" class=\"likes\">\r\n          <a href=\"#likes\" role=\"tab\" data-toggle=\"tab\" data-bypass=\"true\">\r\n            <span class=\"likes-length\">"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.likes : depth0)) != null ? stack1.length : stack1), depth0))
    + "</span>\r\n            <h3>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Following", {"name":"__","hash":{},"data":data})))
    + "</h3>\r\n          </a>\r\n        </li>\r\n\r\n      </ul>\r\n\r\n    </div>\r\n\r\n  </div>\r\n</div>\r\n\r\n<div class=\"body\">\r\n  <div class=\"container\">\r\n\r\n    <div class=\"tab-content\">\r\n      <div role=\"tabpanel\" class=\"tab-pane\" id=\"dashboards\"></div>\r\n      <div role=\"tabpanel\" class=\"tab-pane\" id=\"projects\"></div>\r\n      <div role=\"tabpanel\" class=\"tab-pane\" id=\"collections\"></div>\r\n      <div role=\"tabpanel\" class=\"tab-pane\" id=\"contributions\"></div>\r\n      <div role=\"tabpanel\" class=\"tab-pane\" id=\"likes\"></div>\r\n    </div>\r\n\r\n  </div>\r\n</div>\r\n";
},"useData":true});

},{"hbsfy/runtime":103}],83:[function(require,module,exports){
/**
 * VIEW: An Project of HOME Search
 *
 */

var template = require('./templates/card.hbs');
var ItemView = require('../Home/Item.js');

module.exports = ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'entity project',
  template: template,

  ui: {
    "switcher": ".switcher input",
    "contribute": ".contribute",
    "follow": ".follow"
  },

  events: {
    "click @ui.contribute": "onContribute",
    "click @ui.follow": "onFollow",
    "click .contributors a": "stopPropagation",
    "click .demo-link": "stopPropagation"
  },

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  getURL: function(){

    if (this.isShowcaseMode()){
      return false;
    }

    return "/projects/" + this.model.get("_id");
  },

  afterRender: function(){
    this.$el.attr({
        "data-id": this.model.get("_id")
      , "data-name": this.model.get("title")
      , "data-date": this.model.get("created_at")
      , "data-showcase": this.model.get("showcase")
    });

    if (this.model.get("active")){
      this.$el.addClass('filter-active');
    }
    else {
      this.$el.removeClass('filter-active');
    }

    this.initSwitcher();

    if (hackdash.app.source === "embed"){
      this.$el.attr('target', '_blank');
    }
  },

  serializeData: function(){
    var me = (hackdash.user && hackdash.user._id) || '';
    var isOwner = (this.model.get('leader')._id === me ? true : false);
    var isEmbed = (window.hackdash.app.source === "embed" ? true : false);
    var contribs = this.model.get('contributors');

    var noActions = false;

    if (!isEmbed && isOwner && !this.model.get('link')){
      noActions = true;
    }

    return _.extend({
      noActions: noActions,
      isShowcaseMode: this.isShowcaseMode(),
      contributing: this.model.isContributor(),
      following: this.model.isFollower(),
      isOwner: isOwner,
      contributorsMore: contribs.length > 5 ? contribs.length-4 : 0 
    }, this.model.toJSON());
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  stopPropagation: function(e){
    e.stopPropagation();
  },

  onContribute: function(e){
    e.stopPropagation();

    if (hackdash.app.source === "embed"){
      return;
    }

    e.preventDefault();

    if (!window.hackdash.user){
      hackdash.app.showLogin();
      return;
    }

    this.ui.contribute.button('loading');
    this.model.toggleContribute();
  },

  onFollow: function(e){
    e.stopPropagation();

    if (hackdash.app.source === "embed"){
      return;
    }

    e.preventDefault();

    if (!window.hackdash.user){
      hackdash.app.showLogin();
      return;
    }

    this.ui.follow.button('loading');
    this.model.toggleFollow();
  },

  initSwitcher: function(){
    var self = this;

    if (this.ui.switcher.length > 0){
      this.ui.switcher
        .bootstrapSwitch({
          size: 'mini',
          onColor: 'success',
          offColor: 'danger',
          onSwitchChange: function(event, state){
            self.model.set("active", state);
          }
        });
    }
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  isShowcaseMode: function(){
    return hackdash.app.dashboard && hackdash.app.dashboard.isShowcaseMode;
  }

});

},{"../Home/Item.js":52,"./templates/card.hbs":88}],84:[function(require,module,exports){
/**
 * VIEW: Projects of an Instance
 *
 */

var Project = require('./Card');

module.exports = Backbone.Marionette.CollectionView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "entities",
  childView: Project,

  collectionEvents: {
    "remove": "render",
    "sort:date": "sortByDate",
    "sort:name": "sortByName",
    "sort:showcase": "sortByShowcase"
  },

  gutter: 5,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.showcaseMode = (options && options.showcaseMode) || false;
    this.showcaseSort = (options && options.showcaseSort) || false;
  },

  onRender: function(){
    _.defer(this.onEndRender.bind(this));
  },

  onEndRender: function(){
    this.updateGrid();
    this.refresh();
    this.trigger('ended:render');
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  updateShowcaseOrder: function(){
    var showcase = [];

    $('.entity', this.$el).sort(function (a, b) {

      var av = ( isNaN(+a.dataset.showcase) ? +a.dataset.delay : +a.dataset.showcase +1);
      var bv = ( isNaN(+b.dataset.showcase) ? +b.dataset.delay : +b.dataset.showcase +1);

      return av - bv;
    }).each(function(i, e){
      showcase.push(e.dataset.id);
    });

    return showcase;
  },

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  sortByName: function(){
    if (!this.wall){
      this.updateGrid();
    }

    this.wall.sortBy(function(a, b) {
      var at = $(a).attr('data-name').toLowerCase()
        , bt = $(b).attr('data-name').toLowerCase();

      if(at < bt) { return -1; }
      if(at > bt) { return 1; }
      return 0;

    }).filter('*');

    this.fixSize();

  },

  sortByDate: function(){
    if (!this.wall){
      this.updateGrid();
    }

    this.wall.sortBy(function(a, b) {
      var at = new Date($(a).attr('data-date'))
        , bt = new Date($(b).attr('data-date'));

      if(at > bt) { return -1; }
      if(at < bt) { return 1; }
      return 0;

    }).filter('*');

    this.fixSize();
  },

  sortByShowcase: function(){
    if (!this.wall){
      this.updateGrid();
    }

    this.wall.sortBy(function(a, b) {
      return $(a).attr('data-showcase') - $(b).attr('data-showcase');
    }).filter('.filter-active');

    this.fixSize();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  updateGrid: function(){
    var self = this;

    if (!this.wall){
      this.wall = new window.freewall(this.$el);
    }

    this.wall.reset({
      draggable: this.showcaseMode,
      animate: true,
      keepOrder: false,
      selector: '.entity',
      cellW: 200,
      cellH: 200,
      gutterY: this.gutter,
      gutterX: this.gutter,
      onResize: this.refresh.bind(this),
      onComplete: function() { },
      onBlockDrop: function() {

        var cols = self.$el.attr('data-total-col');
        var pos = $(this).attr('data-position');
        var ps = pos.split('-');

        var row = parseInt(ps[0],10);
        var showcase = ((row*cols) + parseInt(ps[1],10));

        $(this).attr('data-showcase', showcase+1);
        self.model.isDirty = true;
      }
    });

    if (this.showcaseMode){
      this.$el.addClass("showcase");
      this.sortByShowcase();
      return;
    }

    this.sortByDate();

  },

  refresh: function(){
    this.wall.fitWidth();
    this.wall.refresh();
    this.fixSize();
  },

  fixSize: function(){
    this.$el.height(this.$el.height() + this.gutter*4);
  },

});
},{"./Card":83}],85:[function(require,module,exports){
/**
 * VIEW: Project
 *
 */

var template = require('./templates/edit.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "page-ctn project edition",
  template: template,

  ui: {
    "title": "input[name=title]",
    "description": "textarea[name=description]",
    "link": "input[name=link]",
    "tags": "input[name=tags]",
    "status": "select[name=status]",
    "errorCover": ".error-cover"
  },

  events: {
    "click #ghImportBtn": "showGhImport",
    "click #searchGh": "searchRepo",

    "click #save": "save",
    "click #cancel": "cancel"
  },

  templateHelpers: {
    getTags: function(){
      if (this.tags){
        return this.tags.join(',');
      }
    },
    statuses: function(){
      return window.hackdash.statuses;
    }
  },

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onShow: function(){
    this.initSelect2();
    this.initImageDrop();
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  showGhImport: function(e){
    $(".gh-import", this.$el).removeClass('hide');
    this.ui.description.css('margin-top', '30px');
    e.preventDefault();
  },

  searchRepo: function(e){
    var $repo = $("#txt-repo", this.$el),
      $btn = $("#searchGh", this.$el),
      repo = $repo.val();

    $repo.removeClass('btn-danger');
    $btn.button('loading');

    if(repo.length) {
      $.ajax({
        url: 'https://api.github.com/repos/' + repo,
        dataType: 'json',
        contentType: 'json',
        context: this
      })
      .done(this.fillGhProjectForm)
      .error(function(){
        $repo.addClass('btn-danger');
        $btn.button('reset');
      });
    }
    else {
      $repo.addClass('btn-danger');
      $btn.button('reset');
    }

    e.preventDefault();
  },

  save: function(){

    var toSave = {
      title: this.ui.title.val(),
      description: this.ui.description.val(),
      link: this.ui.link.val(),
      tags: this.ui.tags.val().split(','),
      status: this.ui.status.val(),
      cover: this.model.get('cover')
    };

    this.cleanErrors();

    $("#save", this.$el).button('loading');

    this.model
      .save(toSave, { patch: true, silent: true })
      .success(this.redirect.bind(this))
      .error(this.showError.bind(this));
  },

  cancel: function(){
    this.redirect();
  },

  redirect: function(){
    var url = "/dashboards/" + this.model.get('domain');

    if (!this.model.isNew()){
      url = "/projects/" + this.model.get('_id');
    }

    hackdash.app.router.navigate(url, { trigger: true, replace: true });
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  errors: {
    "title_required": __("Title is required"),
    "description_required": __("Description is required")
  },

  showError: function(err){
    $("#save", this.$el).button('reset');

    if (err.responseText === "OK"){
      this.redirect();
      return;
    }

    var error = JSON.parse(err.responseText).error;

    var ctrl = error.split("_")[0];
    this.ui[ctrl].parents('.control-group').addClass('error');
    this.ui[ctrl].after('<span class="help-inline">' + this.errors[error] + '</span>');
  },

  cleanErrors: function(){
    $(".error", this.$el).removeClass("error");
    $("span.help-inline", this.$el).remove();
  },

  initSelect2: function(){
    if (this.model.get('status')){
      this.ui.status.val(this.model.get('status'));
    }

    this.ui.status.select2({
      minimumResultsForSearch: 10
    });


    $('a.select2-choice').attr('href', null);

    this.ui.tags.select2({
      tags:[],
      formatNoMatches: function(){ return ''; },
      maximumInputLength: 20,
      tokenSeparators: [","]
    });
  },

  initImageDrop: function(){
    var self = this;
    var $dragdrop = $('#dragdrop', this.$el);

    var coverZone = new Dropzone("#dragdrop", {
      url: hackdash.apiURL + '/projects/cover',
      paramName: 'cover',
      maxFiles: 1,
      maxFilesize: 0.5, // MB
      acceptedFiles: 'image/jpeg,image/png,image/gif',
      uploadMultiple: false,
      clickable: true,
      dictDefaultMessage: __('Drop Image Here'),
      dictFileTooBig: __('File is too big, 500 Kb is the max'),
      dictInvalidFileType: __('Only jpg, png and gif are allowed')
    });

    coverZone.on("error", function(file, message) {
      self.ui.errorCover.removeClass('hidden').text(message);
    });

    coverZone.on("complete", function(file) {
      if (!file.accepted){
        coverZone.removeFile(file);
        return;
      }

      self.ui.errorCover.addClass('hidden').text('');

      var url = JSON.parse(file.xhr.response).href;
      self.model.set({ "cover": url }, { silent: true });

      coverZone.removeFile(file);

      $dragdrop
        .css('background-image', 'url(' + url + ')');

      $('.dz-message span', $dragdrop).css('opacity', '0.6');

    });
  },

  fillGhProjectForm: function(project) {
    this.ui.title.val(project.name);
    this.ui.description.text(project.description);
    this.ui.link.val(project.html_url);
    this.ui.tags.select2("data", [{id: project.language, text:project.language}]);
    this.ui.status.select2("val", "building");

    $("#searchGh", this.$el).button('reset');
    $("#txt-repo", this.$el).val('');
  }

});
},{"./templates/edit.hbs":89}],86:[function(require,module,exports){
/**
 * VIEW: Full Project view
 *
 */

var template = require("./templates/full.hbs")
  , Sharer = require("../Sharer");

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  id: function(){
    return this.model.get("_id");
  },

  className: "page-ctn project",
  template: template,

  templateHelpers: {
    showActions: function(){
      if (hackdash.user && this.leader){
        return hackdash.user._id !== this.leader._id;
      }
      return false;
    },
    isAdminOrLeader: function(){
      var user = hackdash.user;
      if (this.leader && user){
        return user._id === this.leader._id || user.admin_in.indexOf(this.domain) >= 0;
      }
      return false;
    }
  },

  ui: {
    "contribute": ".contributor a",
    "follow": ".follower a",
    "shareLink": '.share'
  },

  events: {
    "click @ui.contribute": "onContribute",
    "click @ui.follow": "onFollow",
    "click .remove a": "onRemove",
    "click .login": "showLogin",
    "click .share": "showShare",
  },

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    this.$el.addClass(this.model.get("status"));
    $(".tooltips", this.$el).tooltip({});
    if (hackdash.discourseUrl) {
      $.getScript("/js/discourse.js");
    }
    if (hackdash.disqus_shortname) {
      $.getScript("/js/disqus.js");
    }

    $('html, body').scrollTop(0);
  },

  serializeData: function(){
    return _.extend({
      contributing: this.model.isContributor(),
      following: this.model.isFollower()
    }, this.model.toJSON());
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  onContribute: function(e){
    this.ui.contribute.button('loading');
    this.model.toggleContribute();
    e.preventDefault();
  },

  onFollow: function(e){
    this.ui.follow.button('loading');
    this.model.toggleFollow();
    e.preventDefault();
  },

  onRemove: function(){
    if (window.confirm(__("This project is going to be deleted. Are you sure?"))){
      var domain = this.model.get('domain');
      this.model.destroy();

      hackdash.app.router.navigate("/dashboards/" + domain, {
        trigger: true,
        replace: true
      });
    }
  },

  showLogin: function(){
    hackdash.app.showLogin();
  },

  showShare: function(e){
    var el = $(e.target);
    Sharer.show(el, {
      type: 'project',
      model: this.model
    });
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"../Sharer":92,"./templates/full.hbs":90}],87:[function(require,module,exports){
/**
 * VIEW: Login Modal
 *
 */

var template = require('./templates/share.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "share",
  template: template,

  ui: {
    'prg': '#prg',
    'pic': '#pic',
    'title': '#title',
    'desc': '#desc',
    'contrib': '#contrib',
    'acnbar': '#acnbar',

    'preview': '.preview iframe',
    'code': '#embed-code'
  },

  events: {
    "click .close": "destroy",
    "click .checkbox": "onClickSetting"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    this.embedTmpl = _.template('<iframe src="<%= url %>" width="100%" height="450" frameborder="0" allowtransparency="true" title="Hackdash"></iframe>');
  },

  onRender: function(){
    this.reloadPreview();
  },

  serializeData: function(){
    return _.extend({
      settings: this.settings
    }, this.model.toJSON());
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  hiddenSettings: [],

  onClickSetting: function(e){
    var ele = $('input', e.currentTarget);
    var id = ele.attr('id');
    var checked = $(ele).is(':checked');
    var idx = this.hiddenSettings.indexOf(id);

    if (checked){
      if(idx > -1){
        this.hiddenSettings.splice(idx, 1);
        this.reloadPreview();
      }
      return;
    }

    if (idx === -1){
      this.hiddenSettings.push(id);
      this.reloadPreview();
    }
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  reloadPreview: function(){
    var embedUrl = window.location.protocol + "//" + window.location.host;
    var fragment = '/embed/projects/' + this.model.get('_id');
    var hide = '?hide=';

    _.each(this.hiddenSettings, function(id){
      hide += id + ',';
    }, this);

    var url = embedUrl + fragment + (this.hiddenSettings.length ? hide : '');

    this.ui.preview.attr('src', url);
    this.ui.code.val(this.embedTmpl({ url: url }));
  },

  settings: [{
    code: 'prg',
    name: __('Progress')
  }, {
    code: 'pic',
    name: __('Picture')
  }, {
    code: 'title',
    name: __('Title')
  }, {
    code: 'desc',
    name: __('Description')
  }, {
    code: 'contrib',
    name: __('Contributors')
  }, {
    code: 'acnbar',
    name: __('Action Bar')
  }]

});
},{"./templates/share.hbs":91}],88:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <div class=\"item-cover\" style=\"background-image: url("
    + escapeExpression(((helper = (helper = helpers.cover || (depth0 != null ? depth0.cover : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"cover","hash":{},"data":data}) : helper)))
    + ");\"></div>\r\n";
},"3":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <i class=\"item-letter\">"
    + escapeExpression(((helpers.firstLetter || (depth0 && depth0.firstLetter) || helperMissing).call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"firstLetter","hash":{},"data":data})))
    + "</i>\r\n";
},"5":function(depth0,helpers,partials,data) {
  return "target=\"_blank\"";
  },"7":function(depth0,helpers,partials,data) {
  return "data-bypass";
  },"9":function(depth0,helpers,partials,data) {
  return "no-actions";
  },"11":function(depth0,helpers,partials,data,depths) {
  var stack1, helper, options, helperMissing=helpers.helperMissing, lambda=this.lambda, escapeExpression=this.escapeExpression, functionType="function", blockHelperMissing=helpers.blockHelperMissing, buffer = "\r\n";
  stack1 = ((helpers.each_upto || (depth0 && depth0.each_upto) || helperMissing).call(depth0, (depth0 != null ? depth0.contributors : depth0), 4, {"name":"each_upto","hash":{},"fn":this.program(12, data, depths),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "    <li class=\"contrib-plus\">\r\n      <a href=\"/projects/"
    + escapeExpression(lambda((depths[1] != null ? depths[1]._id : depths[1]), depth0))
    + "\"\r\n";
  stack1 = ((helper = (helper = helpers.isEmbed || (depth0 != null ? depth0.isEmbed : depth0)) != null ? helper : helperMissing),(options={"name":"isEmbed","hash":{},"fn":this.program(13, data, depths),"inverse":this.program(15, data, depths),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isEmbed) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + ">\r\n        "
    + escapeExpression(((helper = (helper = helpers.contributorsMore || (depth0 != null ? depth0.contributorsMore : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"contributorsMore","hash":{},"data":data}) : helper)))
    + "+\r\n      </a>\r\n    </li>\r\n\r\n";
},"12":function(depth0,helpers,partials,data) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing, buffer = "    <li>\r\n      <a href=\"/users/"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "\"\r\n";
  stack1 = ((helper = (helper = helpers.isEmbed || (depth0 != null ? depth0.isEmbed : depth0)) != null ? helper : helperMissing),(options={"name":"isEmbed","hash":{},"fn":this.program(13, data),"inverse":this.program(15, data),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isEmbed) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + ">\r\n        "
    + escapeExpression(((helpers.getProfileImage || (depth0 && depth0.getProfileImage) || helperMissing).call(depth0, depth0, {"name":"getProfileImage","hash":{},"data":data})))
    + "\r\n      </a>\r\n    </li>\r\n";
},"13":function(depth0,helpers,partials,data) {
  return "        target=\"_blank\"\r\n";
  },"15":function(depth0,helpers,partials,data) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing, buffer = "        ";
  stack1 = ((helper = (helper = helpers.isLandingView || (depth0 != null ? depth0.isLandingView : depth0)) != null ? helper : helperMissing),(options={"name":"isLandingView","hash":{},"fn":this.program(7, data),"inverse":this.noop,"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isLandingView) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\r\n      ";
},"17":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "\r\n";
  stack1 = ((helpers.each_upto || (depth0 && depth0.each_upto) || helperMissing).call(depth0, (depth0 != null ? depth0.contributors : depth0), 5, {"name":"each_upto","hash":{},"fn":this.program(12, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\r\n";
},"19":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, lambda=this.lambda;
  return "    <a href=\"/projects/"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "\"\r\n      class=\"tooltips contribute\" target=\"_blank\"\r\n      data-original-title=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.contributors : depth0)) != null ? stack1.length : stack1), depth0))
    + " contributors\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Join", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n    <a href=\"/projects/"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "\"\r\n      class=\"tooltips follow\" target=\"_blank\"\r\n      data-original-title=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.followers : depth0)) != null ? stack1.length : stack1), depth0))
    + " followers\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Follow", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"21":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\r\n";
  stack1 = helpers.unless.call(depth0, (depth0 != null ? depth0.isOwner : depth0), {"name":"unless","hash":{},"fn":this.program(22, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\r\n";
},"22":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.contributing : depth0), {"name":"if","hash":{},"fn":this.program(23, data),"inverse":this.program(25, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.following : depth0), {"name":"if","hash":{},"fn":this.program(27, data),"inverse":this.program(29, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"23":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;
  return "      <a\r\n        class=\"tooltips contribute\"\r\n        data-loading-text=\"leaving...\"\r\n        data-original-title=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.contributors : depth0)) != null ? stack1.length : stack1), depth0))
    + " contributors\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Leave", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"25":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;
  return "      <a\r\n        class=\"tooltips contribute\"\r\n        data-loading-text=\"joining...\"\r\n        data-original-title=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.contributors : depth0)) != null ? stack1.length : stack1), depth0))
    + " contributors\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Join", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"27":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;
  return "      <a\r\n        class=\"tooltips follow\"\r\n        data-loading-text=\"unfollowing...\"\r\n        data-original-title=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.followers : depth0)) != null ? stack1.length : stack1), depth0))
    + " followers\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Unfollow", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"29":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;
  return "      <a\r\n        class=\"tooltips follow\"\r\n        data-loading-text=\"following...\"\r\n        data-original-title=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.followers : depth0)) != null ? stack1.length : stack1), depth0))
    + " followers\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Follow", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"31":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <a class=\"demo-link\" href=\""
    + escapeExpression(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"link","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\" data-bypass>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Demo", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"33":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isShowcaseMode : depth0), {"name":"if","hash":{},"fn":this.program(34, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"34":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\r\n  <div class=\"switcher tooltips\" data-placement=\"top\" data-original-title=\"Toggle visibility\">\r\n    <input type=\"checkbox\" ";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.active : depth0), {"name":"if","hash":{},"fn":this.program(35, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + " class=\"switch-small\">\r\n  </div>\r\n\r\n";
},"35":function(depth0,helpers,partials,data) {
  return "checked";
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data,depths) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing, buffer = "\r\n<div class=\"progress\" title=\""
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\">\r\n  <div class=\"progress-bar progress-bar-success progress-bar-striped "
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\" role=\"progressbar\">\r\n  </div>\r\n</div>\r\n\r\n<div class=\"cover\">\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.cover : depth0), {"name":"if","hash":{},"fn":this.program(1, data, depths),"inverse":this.program(3, data, depths),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "</div>\r\n\r\n<div class=\"details\">\r\n  <div>\r\n    <h2>"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</h2>\r\n    <h3><a href=\"/dashboards/"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "\"\r\n      ";
  stack1 = ((helper = (helper = helpers.isEmbed || (depth0 != null ? depth0.isEmbed : depth0)) != null ? helper : helperMissing),(options={"name":"isEmbed","hash":{},"fn":this.program(5, data, depths),"inverse":this.program(7, data, depths),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isEmbed) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  buffer += ">"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "</a></h3>\r\n    <p class=\"description\">"
    + escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"description","hash":{},"data":data}) : helper)))
    + "</p>\r\n  </div>\r\n</div>\r\n\r\n<ul class=\"contributors ";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.noActions : depth0), {"name":"if","hash":{},"fn":this.program(9, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\">\r\n\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.contributorsMore : depth0), {"name":"if","hash":{},"fn":this.program(11, data, depths),"inverse":this.program(17, data, depths),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "</ul>\r\n\r\n<div class=\"action-bar text-right ";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.noActions : depth0), {"name":"if","hash":{},"fn":this.program(9, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\">\r\n\r\n  <i class=\"fa fa-clock-o timer tooltips\"\r\n    data-original-title=\""
    + escapeExpression(((helpers.timeAgo || (depth0 && depth0.timeAgo) || helperMissing).call(depth0, (depth0 != null ? depth0.created_at : depth0), {"name":"timeAgo","hash":{},"data":data})))
    + "\"></i>\r\n\r\n  <div class=\"action-links\">\r\n\r\n";
  stack1 = ((helper = (helper = helpers.isEmbed || (depth0 != null ? depth0.isEmbed : depth0)) != null ? helper : helperMissing),(options={"name":"isEmbed","hash":{},"fn":this.program(19, data, depths),"inverse":this.program(21, data, depths),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isEmbed) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.link : depth0), {"name":"if","hash":{},"fn":this.program(31, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n  </div>\r\n\r\n</div>\r\n\r\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : helperMissing),(options={"name":"isLoggedIn","hash":{},"fn":this.program(33, data, depths),"inverse":this.noop,"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isLoggedIn) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"useData":true,"useDepths":true});

},{"hbsfy/runtime":103}],89:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <div id=\"ghImportHolder\" class=\"hidden-xs\">\r\n\r\n      <div class=\"project-link\">\r\n        <a id=\"ghImportBtn\" >\r\n          <label>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Import Project", {"name":"__","hash":{},"data":data})))
    + "</label>\r\n          <div>\r\n            <i class=\"fa fa-github\"></i>\r\n            <span class=\"github\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "GitHub", {"name":"__","hash":{},"data":data})))
    + "</span>\r\n          </div>\r\n        </a>\r\n      </div>\r\n\r\n      <div class=\"gh-import input-group col-md-4 hide\">\r\n        <input id=\"txt-repo\" type=\"text\" class=\"form-control\" placeholder=\"username / repository\">\r\n        <span class=\"input-group-btn\">\r\n          <button id=\"searchGh\" class=\"btn btn-blue\" type=\"button\" data-loading-text='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "LOADING", {"name":"__","hash":{},"data":data})))
    + "'>\r\n            "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "import", {"name":"__","hash":{},"data":data})))
    + "\r\n          </button>\r\n        </span>\r\n      </div>\r\n\r\n    </div>\r\n";
},"3":function(depth0,helpers,partials,data) {
  var lambda=this.lambda, escapeExpression=this.escapeExpression;
  return "              <option value=\""
    + escapeExpression(lambda(depth0, depth0))
    + "\">"
    + escapeExpression(lambda(depth0, depth0))
    + "</option>\r\n";
},"5":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          style=\"background-image: url("
    + escapeExpression(((helper = (helper = helpers.cover || (depth0 != null ? depth0.cover : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"cover","hash":{},"data":data}) : helper)))
    + ");\"\r\n          ";
},"7":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          href=\"/projects/"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "\"\r\n";
},"9":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          href=\"/dashboards/"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "\"\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", buffer = "\r\n<div class=\"header\">\r\n  <div class=\"container\">\r\n    <h1>\r\n      <input name=\"title\" type=\"text\" placeholder='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Project Title", {"name":"__","hash":{},"data":data})))
    + "' value=\""
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "\" class=\"form-control\"/>\r\n    </h1>\r\n    <h3 class=\"page-link-left\">\r\n      <a href=\"/dashboards/"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "\">"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "</a>\r\n    </h3>\r\n  </div>\r\n</div>\r\n\r\n<div class=\"body\">\r\n  <div class=\"bg-body-entity\"></div>\r\n  <div class=\"container\">\r\n\r\n";
  stack1 = helpers.unless.call(depth0, (depth0 != null ? depth0._id : depth0), {"name":"unless","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n    <div class=\"col-md-4\">\r\n\r\n      <div class=\"cover\">\r\n\r\n        <div class=\"progress\" title=\""
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\">\r\n          <div class=\"status\">\r\n            <select name=\"status\" id=\"status\" class=\"form-control\" value=\""
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\">\r\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.statuses : depth0), {"name":"each","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "            </select>\r\n          </div>\r\n        </div>\r\n\r\n        <div id=\"dragdrop\" class=\"dropzone item-cover\"\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.cover : depth0), {"name":"if","hash":{},"fn":this.program(5, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += ">\r\n        </div>\r\n        <p class=\"error-cover bg-danger text-danger hidden\"></p>\r\n\r\n      </div>\r\n\r\n    </div>\r\n\r\n    <div class=\"col-md-8\">\r\n      <div class=\"description\">\r\n        <textarea id=\"description\" name=\"description\" placeholder=\"Description\">"
    + escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"description","hash":{},"data":data}) : helper)))
    + "</textarea>\r\n      </div>\r\n      <div class=\"tags\">\r\n        <input id=\"tags\" type=\"text\" name=\"tags\" placeholder='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Tags", {"name":"__","hash":{},"data":data})))
    + "' class=\"form-control\" value=\""
    + escapeExpression(((helper = (helper = helpers.getTags || (depth0 != null ? depth0.getTags : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"getTags","hash":{},"data":data}) : helper)))
    + "\"/>\r\n      </div>\r\n      <div class=\"link\">\r\n        <input id=\"link\" type=\"text\" name=\"link\" placeholder='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Project URL Demo", {"name":"__","hash":{},"data":data})))
    + "' class=\"form-control\" value=\""
    + escapeExpression(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"link","hash":{},"data":data}) : helper)))
    + "\"/>\r\n      </div>\r\n    </div>\r\n\r\n    <div class=\"col-md-8 buttons-panel\">\r\n\r\n      <div class=\"pull-right save\">\r\n        <a id=\"save\" class=\"btn btn-success\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Save", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n      </div>\r\n\r\n      <div class=\"pull-right cancel\">\r\n        <a id=\"cancel\" class=\"btn btn-danger\"\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0._id : depth0), {"name":"if","hash":{},"fn":this.program(7, data),"inverse":this.program(9, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "        >"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Cancel", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n      </div>\r\n\r\n    </div>\r\n\r\n  </div>\r\n\r\n</div>\r\n";
},"useData":true});

},{"hbsfy/runtime":103}],90:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  return "no-cover";
  },"3":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <div class=\"item-cover\"\r\n          style=\"background-image: url("
    + escapeExpression(((helper = (helper = helpers.cover || (depth0 != null ? depth0.cover : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"cover","hash":{},"data":data}) : helper)))
    + ");\"></div>\r\n";
},"5":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <i class=\"item-letter\">"
    + escapeExpression(((helpers.firstLetter || (depth0 && depth0.firstLetter) || helperMissing).call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"firstLetter","hash":{},"data":data})))
    + "</i>\r\n";
},"7":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.showActions : depth0), {"name":"if","hash":{},"fn":this.program(8, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\r\n";
},"8":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\r\n          <div class=\"contributor\">\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.contributing : depth0), {"name":"if","hash":{},"fn":this.program(9, data),"inverse":this.program(11, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "          </div>\r\n          <div class=\"follower\">\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.following : depth0), {"name":"if","hash":{},"fn":this.program(13, data),"inverse":this.program(15, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "          </div>\r\n\r\n";
},"9":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "            <a data-loading-text=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "leaving...", {"name":"__","hash":{},"data":data})))
    + "\" class=\"btn btn-default leave\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Leave", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"11":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "            <a data-loading-text=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "joining...", {"name":"__","hash":{},"data":data})))
    + "\" class=\"btn btn-default join\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Join", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"13":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "            <a data-loading-text=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "unfollowing...", {"name":"__","hash":{},"data":data})))
    + "\" class=\"btn btn-default unfollow\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Unfollow", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"15":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "            <a data-loading-text=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "following...", {"name":"__","hash":{},"data":data})))
    + "\" class=\"btn btn-default follow\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Follow", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"17":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "\r\n        <a class=\"btn btn-default login\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Follow", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n        <a class=\"btn btn-default login\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Join", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n\r\n";
},"19":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          <a class=\"pull-left\" href=\"/users/"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "\">\r\n            "
    + escapeExpression(((helpers.getProfileImageHex || (depth0 && depth0.getProfileImageHex) || helperMissing).call(depth0, depth0, {"name":"getProfileImageHex","hash":{},"data":data})))
    + "\r\n          </a>\r\n";
},"21":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = helpers['if'].call(depth0, depth0, {"name":"if","hash":{},"fn":this.program(22, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"22":function(depth0,helpers,partials,data) {
  var lambda=this.lambda, escapeExpression=this.escapeExpression;
  return "        <li>\r\n          <a href=\"/projects?q="
    + escapeExpression(lambda(depth0, depth0))
    + "\" data-bypass=\"true\">"
    + escapeExpression(lambda(depth0, depth0))
    + "</a>\r\n        </li>\r\n";
},"24":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <div class=\"pull-right\">\r\n      <a href=\""
    + escapeExpression(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"link","hash":{},"data":data}) : helper)))
    + "\" target=\"__blank\" class=\"btn btn-default\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "demo", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n    </div>\r\n";
},"26":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isAdminOrLeader : depth0), {"name":"if","hash":{},"fn":this.program(27, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.showActions : depth0), {"name":"if","hash":{},"fn":this.program(29, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\r\n";
},"27":function(depth0,helpers,partials,data) {
  var helper, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function";
  return "      <div class=\"pull-right remove\">\r\n        <a class=\"btn btn-danger\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Remove", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n      </div>\r\n      <div class=\"pull-right edit\">\r\n        <a class=\"btn btn-success\" href=\"/projects/"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "/edit\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Edit", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n      </div>\r\n";
},"29":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\r\n      <div class=\"pull-left bottom-buttons\">\r\n\r\n        <div class=\"pull-left contributor\">\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.contributing : depth0), {"name":"if","hash":{},"fn":this.program(30, data),"inverse":this.program(32, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "        </div>\r\n        <div class=\"pull-left follower\">\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.following : depth0), {"name":"if","hash":{},"fn":this.program(34, data),"inverse":this.program(36, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "        </div>\r\n\r\n      </div>\r\n";
},"30":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          <a data-loading-text=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "leaving...", {"name":"__","hash":{},"data":data})))
    + "\" class=\"btn btn-default leave\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Leave", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"32":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          <a data-loading-text=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "joining...", {"name":"__","hash":{},"data":data})))
    + "\" class=\"btn btn-default join\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Join", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"34":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          <a data-loading-text=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "unfollowing...", {"name":"__","hash":{},"data":data})))
    + "\" class=\"btn btn-default unfollow\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Unfollow", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"36":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          <a data-loading-text=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "following...", {"name":"__","hash":{},"data":data})))
    + "\" class=\"btn btn-default follow\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Follow", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"38":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "\r\n      <div class=\"pull-left bottom-buttons\">\r\n        <a class=\"btn btn-default login\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Follow", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n        <a class=\"btn btn-default login\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Join", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n      </div>\r\n\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing, lambda=this.lambda, buffer = "\r\n<div class=\"header\">\r\n  <div class=\"container\">\r\n    <h1>"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</h1>\r\n    <h3 class=\"page-link-left\">\r\n      <a href=\"/dashboards/"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "\">"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "</a>\r\n    </h3>\r\n  </div>\r\n</div>\r\n\r\n<div class=\"body\">\r\n  <div class=\"bg-body-entity\"></div>\r\n  <div class=\"container\">\r\n\r\n    <div class=\"col-md-4\">\r\n\r\n      <div class=\"cover ";
  stack1 = helpers.unless.call(depth0, (depth0 != null ? depth0.cover : depth0), {"name":"unless","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\">\r\n\r\n        <div class=\"progress\" title=\""
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\">\r\n          <div class=\""
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\"></div>\r\n          <div class=\"status\">"
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "</div>\r\n        </div>\r\n\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.cover : depth0), {"name":"if","hash":{},"fn":this.program(3, data),"inverse":this.program(5, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "      </div>\r\n\r\n\r\n      <div class=\"buttons-panel top-buttons\">\r\n\r\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : helperMissing),(options={"name":"isLoggedIn","hash":{},"fn":this.program(7, data),"inverse":this.program(17, data),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isLoggedIn) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n        <a class=\"share tooltips share-top\" data-original-title=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Share this Project", {"name":"__","hash":{},"data":data})))
    + "\">\r\n          <i class=\"fa fa-share-alt\"></i>\r\n        </a>\r\n      </div>\r\n\r\n      <div class=\"people\">\r\n\r\n        <div class=\"clearfix\">\r\n          <h5>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Managed by", {"name":"__","hash":{},"data":data})))
    + "</h5>\r\n          <a class=\"pull-left\" href=\"/users/"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.leader : depth0)) != null ? stack1._id : stack1), depth0))
    + "\">\r\n            "
    + escapeExpression(((helpers.getProfileImageHex || (depth0 && depth0.getProfileImageHex) || helperMissing).call(depth0, (depth0 != null ? depth0.leader : depth0), {"name":"getProfileImageHex","hash":{},"data":data})))
    + "\r\n          </a>\r\n        </div>\r\n\r\n        <div class=\"clearfix\">\r\n          <h5>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Contributors", {"name":"__","hash":{},"data":data})))
    + " ["
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.contributors : depth0)) != null ? stack1.length : stack1), depth0))
    + "]</h5>\r\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.contributors : depth0), {"name":"each","hash":{},"fn":this.program(19, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "        </div>\r\n\r\n        <div class=\"clearfix\">\r\n          <h5>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Followers", {"name":"__","hash":{},"data":data})))
    + " ["
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.followers : depth0)) != null ? stack1.length : stack1), depth0))
    + "]</h5>\r\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.followers : depth0), {"name":"each","hash":{},"fn":this.program(19, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "        </div>\r\n\r\n      </div>\r\n\r\n    </div>\r\n\r\n    <div class=\"col-md-8\">\r\n      <div class=\"description\">\r\n        ";
  stack1 = ((helpers.markdown || (depth0 && depth0.markdown) || helperMissing).call(depth0, (depth0 != null ? depth0.description : depth0), {"name":"markdown","hash":{},"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n      </div>\r\n      <ul class=\"tags clearfix col-md-10\">\r\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.tags : depth0), {"name":"each","hash":{},"fn":this.program(21, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "      </ul>\r\n      <div class=\"share-ctn clearfix col-md-2 share-inner\">\r\n        <a class=\"share tooltips\" data-original-title=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Share this Project", {"name":"__","hash":{},"data":data})))
    + "\">\r\n          <i class=\"fa fa-share-alt\"></i>\r\n        </a>\r\n      </div>\r\n    </div>\r\n\r\n    <div class=\"col-md-12 buttons-panel\">\r\n\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.link : depth0), {"name":"if","hash":{},"fn":this.program(24, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : helperMissing),(options={"name":"isLoggedIn","hash":{},"fn":this.program(26, data),"inverse":this.program(38, data),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isLoggedIn) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "    </div>\r\n\r\n  </div>\r\n\r\n  <div class=\"container discourse-ctn\">\r\n  </div>\r\n\r\n  <div class=\"container disqus-ctn\">\r\n    <div id=\"disqus_thread\" class=\"col-md-12\"></div>\r\n  </div>\r\n\r\n</div>\r\n";
},"useData":true});

},{"hbsfy/runtime":103}],91:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "\r\n        <div class=\"checkbox\">\r\n          <label>\r\n            <input id=\""
    + escapeExpression(((helper = (helper = helpers.code || (depth0 != null ? depth0.code : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"code","hash":{},"data":data}) : helper)))
    + "\" type=\"checkbox\" checked> "
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\r\n          </label>\r\n        </div>\r\n\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<div class=\"modal-body\">\r\n\r\n  <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\r\n    <i class=\"fa fa-close\"></i>\r\n  </button>\r\n\r\n  <div class=\"row\">\r\n    <div class=\"col-md-5\">\r\n\r\n      <h1>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "embed this project", {"name":"__","hash":{},"data":data})))
    + "</h1>\r\n\r\n      <div class=\"settings\">\r\n\r\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.settings : depth0), {"name":"each","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\r\n      </div>\r\n\r\n      <label class=\"get-code\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Add this project to your website by coping this code below", {"name":"__","hash":{},"data":data})))
    + "</label>\r\n      <textarea id=\"embed-code\" onclick=\"this.focus();this.select();\" readonly=\"readonly\"></textarea>\r\n\r\n    </div>\r\n    <div class=\"col-md-7\" style=\"position:relative;\">\r\n      <div class=\"preview\">\r\n        <iframe width=\"100%\" height=\"450\"\r\n          frameborder=\"0\" allowtransparency=\"true\" title=\"Hackdash\"></iframe>\r\n      </div>\r\n    </div>\r\n  </div>\r\n\r\n</div>\r\n";
},"useData":true});

},{"hbsfy/runtime":103}],92:[function(require,module,exports){
/**
 * VIEW: Share Popover
 *
 */

var template = require('./templates/sharer.hbs'),
  DashboardEmbed = require("./Dashboard/Share"),
  ProjectEmbed = require("./Project/Share");

/*jshint scripturl:true */

var Sharer = module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  id: 'sharer-dialog',
  className: "sharer",
  template: template,

  events: {
    "click .embed": "showEmbed",
    "click .close": "destroy",

    "click .facebook": "showFBShare",
    "click .linkedin": "showLinkedInShare"
  },

  shareText: {
    dashboard: 'Hacking at ',
    project: 'Hacking '
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.type = (options && options.type) || '';
  },

  serializeData: function(){
    return _.extend({
      networks: this.getNetworks()
    }, (this.model && this.model.toJSON()) || {});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  showEmbed: function(){
    var Share;

    switch(this.type){
      case 'dashboard': Share = DashboardEmbed; break;
      case 'project': Share = ProjectEmbed; break;
    }

    if (Share){
      hackdash.app.modals.show(new Share({
        model: this.model
      }));
    }

    this.destroy();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  enc: function(str){
    return window.encodeURI(str);
  },

  getTwitterLink: function(){
    var link = 'https://twitter.com/intent/tweet?'
      , people = ''
      , url = 'url=' + window.location.protocol + "//" + window.location.host
      , hashtags = 'hashtags='
      , text = 'text=';

    var domain = this.model.get('domain');
    var title = this.model.get('title');

    function getPeople(list){
      return _.map(list, function(user){

        if (hackdash.user && hackdash.user._id === user._id){
          // remove me
          return '';
        }

        if (user.provider === 'twitter'){
          return '@' + user.username;
        }
        else {
          return user.name;
        }

        return '';

      }).join(' ');
    }

    if (this.type === 'dashboard'){
      people = getPeople(this.model.get('admins').toJSON());
      url += '/d/' + domain;
    }

    else if (this.type === 'project'){
      people = getPeople(this.model.get('contributors'));
      url += '/p/' + this.model.get('_id');
    }

    hashtags += ['hackdash', domain].join(',');
    text += this.shareText[this.type] + (title || domain) + ' via ' + people;

    link += this.enc(url) + '&' + this.enc(hashtags) + '&' + this.enc(text);
    return link;
  },

  showFBShare: function(e){
    e.preventDefault();

    var people = ''
      , url = '' + window.location.protocol + "//" + window.location.host
      , text = ''
      , picture = '';

    var domain = this.model.get('domain');
    var title = this.model.get('title');

    function getPeople(list){
      return _.map(list, function(user){

        if (hackdash.user && hackdash.user._id === user._id){
          // remove me
          return '';
        }

        return user.name;

      }).join(', ');
    }

    if (this.type === 'dashboard'){
      people = getPeople(this.model.get('admins').toJSON());

      var covers = this.model.get('covers');
      picture = url + ((covers && covers.length && covers[0]) || '/images/logohack.png');

      url += '/d/' + domain;
    }

    else if (this.type === 'project'){
      people = getPeople(this.model.get('contributors'));

      var cover = this.model.get('cover');
      picture = url + (cover || '/images/logohack.png');

      url += '/p/' + this.model.get('_id');
    }

    var textShort = __('Hacking at') + ' ' + (title || domain);
    text += textShort + ' via ' + people;
    text += ' ' + ['#hackdash', domain].join(' #');

    window.FB.ui({
      method: 'feed',
      name: textShort,
      link: url,
      picture: picture,
      caption: text
    }, function( response ) {
      console.log(response);
    });
  },

  showLinkedInShare: function(e){
    e.preventDefault();

    var link = 'https://www.linkedin.com/shareArticle?mini=true&'
      , url = 'url=' + window.location.protocol + "//" + window.location.host
      , stitle = 'title='
      , text = 'summary='
      , source = '&source=HackDash';

    var domain = this.model.get('domain');
    var title = this.model.get('title');

    if (this.type === 'dashboard'){
      url += '/d/' + domain;
    }
    else if (this.type === 'project'){
      url += '/p/' + this.model.get('_id');
    }

    var textShort = __('Hacking at') + ' ' + (title || domain);
    stitle += textShort;
    text += textShort + ' - HackDash';

    link += this.enc(url) + '&' + this.enc(stitle) + '&' + this.enc(text) + source;
    window.open(link,'LinkedIn','height=350,width=520');
  },

  getNetworks: function(){

    var networks = [{
      name: 'twitter',
      link: this.getTwitterLink()
    }];

    if (window.hackdash.fbAppId){
      networks.push({
        name: 'facebook'
      });
    }

    return networks.concat([{
      name: 'linkedin'
    }, {
      name: 'google-plus',
      link: "javascript:void(window.open('https://plus.google.com/share?url='+encodeURIComponent(location), 'Share to Google+','width=600,height=460,menubar=no,location=no,status=no'));"
    }]);

  }

}, {

  show: function(el, options){

    var sharer = new Sharer(options);
    sharer.render();

    $('body').append(sharer.$el);

    var clickOutside = function(e){
      var $target = $(e.target);
      if ($target.hasClass('share') || $target.hasClass('fa-share-alt')){
        return;
      }

      var id = '#' + sharer.$el.get(0).id;

      if(!$target.closest(id).length && $(id).is(":visible")) {
        sharer.destroy();
      }
    };

    $('html').on('click', clickOutside);

    var $el = $(el),
      offset = $el.offset(),
      mw = $(window).width(),
      elW = sharer.$el.width(),
      w = sharer.$el.width()/2 - $el.width()/2,
      h = sharer.$el.height()/2 - $el.height()/2,
      l = offset.left - w,
      t = offset.top - h;

    if (l + elW > mw){
      l -= (l + (elW*1.2)) - mw;
    }

    sharer.$el.css({
      top: t,
      left: l
    });

    sharer.on('close destroy', function(){
      sharer.$el.remove();
      $('html').off('click', clickOutside);
    });

    return sharer;
  }

});
},{"./Dashboard/Share":31,"./Project/Share":87,"./templates/sharer.hbs":95}],93:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data,depths) {
  var lambda=this.lambda, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;
  return "\r\n      <div class=\"col-xs-12 col-md-8 col-md-offset-2\">\r\n        <a href=\"/auth/"
    + escapeExpression(lambda(depth0, depth0))
    + escapeExpression(lambda((depths[1] != null ? depths[1].redirectURL : depths[1]), depth0))
    + "\" class=\"btn btn-primary signup-btn signup-"
    + escapeExpression(lambda(depth0, depth0))
    + "\" data-bypass>\r\n          <i class=\"fa fa-"
    + escapeExpression(lambda(depth0, depth0))
    + "\"></i>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Access with", {"name":"__","hash":{},"data":data})))
    + " "
    + escapeExpression(((helpers.firstUpper || (depth0 && depth0.firstUpper) || helperMissing).call(depth0, depth0, {"name":"firstUpper","hash":{},"data":data})))
    + "\r\n        </a>\r\n      </div>\r\n\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data,depths) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<div class=\"modal-header\">\r\n  <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\r\n    <i class=\"fa fa-close\"></i>\r\n  </button>\r\n  <h2 class=\"modal-title\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Log In", {"name":"__","hash":{},"data":data})))
    + "</h2>\r\n</div>\r\n\r\n<div class=\"modal-body\">\r\n  <div class=\"row\">\r\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.providers : depth0), {"name":"each","hash":{},"fn":this.program(1, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  </div>\r\n</div>\r\n";
},"useData":true,"useDepths":true});

},{"hbsfy/runtime":103}],94:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<div class=\"modal-header\">\r\n  <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\r\n    <i class=\"fa fa-close\"></i>\r\n  </button>\r\n  <h3 class=\"modal-title\">"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</h3>\r\n</div>\r\n\r\n<div class=\"modal-body\">\r\n  <p class=\"bg-"
    + escapeExpression(((helper = (helper = helpers.type || (depth0 != null ? depth0.type : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"type","hash":{},"data":data}) : helper)))
    + "\">"
    + escapeExpression(((helper = (helper = helpers.message || (depth0 != null ? depth0.message : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"message","hash":{},"data":data}) : helper)))
    + "</p>\r\n</div>\r\n";
},"useData":true});

},{"hbsfy/runtime":103}],95:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "    <li class=\""
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\">\r\n      <a ";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.link : depth0), {"name":"if","hash":{},"fn":this.program(2, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + ">\r\n        <i class=\"fa fa-"
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\"></i>\r\n      </a>\r\n    </li>\r\n";
},"2":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "href=\""
    + escapeExpression(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"link","hash":{},"data":data}) : helper)))
    + "\"";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<div class=\"embed\">\r\n  <a>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "embed/insert", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n</div>\r\n<div class=\"social-buttons\">\r\n  <ul>\r\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.networks : depth0), {"name":"each","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  </ul>\r\n</div>";
},"useData":true});

},{"hbsfy/runtime":103}],96:[function(require,module,exports){
"use strict";
/*globals Handlebars: true */
var base = require("./handlebars/base");

// Each of these augment the Handlebars object. No need to setup here.
// (This is done to easily share code between commonjs and browse envs)
var SafeString = require("./handlebars/safe-string")["default"];
var Exception = require("./handlebars/exception")["default"];
var Utils = require("./handlebars/utils");
var runtime = require("./handlebars/runtime");

// For compatibility and usage outside of module systems, make the Handlebars object a namespace
var create = function() {
  var hb = new base.HandlebarsEnvironment();

  Utils.extend(hb, base);
  hb.SafeString = SafeString;
  hb.Exception = Exception;
  hb.Utils = Utils;
  hb.escapeExpression = Utils.escapeExpression;

  hb.VM = runtime;
  hb.template = function(spec) {
    return runtime.template(spec, hb);
  };

  return hb;
};

var Handlebars = create();
Handlebars.create = create;

Handlebars['default'] = Handlebars;

exports["default"] = Handlebars;
},{"./handlebars/base":97,"./handlebars/exception":98,"./handlebars/runtime":99,"./handlebars/safe-string":100,"./handlebars/utils":101}],97:[function(require,module,exports){
"use strict";
var Utils = require("./utils");
var Exception = require("./exception")["default"];

var VERSION = "2.0.0";
exports.VERSION = VERSION;var COMPILER_REVISION = 6;
exports.COMPILER_REVISION = COMPILER_REVISION;
var REVISION_CHANGES = {
  1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
  2: '== 1.0.0-rc.3',
  3: '== 1.0.0-rc.4',
  4: '== 1.x.x',
  5: '== 2.0.0-alpha.x',
  6: '>= 2.0.0-beta.1'
};
exports.REVISION_CHANGES = REVISION_CHANGES;
var isArray = Utils.isArray,
    isFunction = Utils.isFunction,
    toString = Utils.toString,
    objectType = '[object Object]';

function HandlebarsEnvironment(helpers, partials) {
  this.helpers = helpers || {};
  this.partials = partials || {};

  registerDefaultHelpers(this);
}

exports.HandlebarsEnvironment = HandlebarsEnvironment;HandlebarsEnvironment.prototype = {
  constructor: HandlebarsEnvironment,

  logger: logger,
  log: log,

  registerHelper: function(name, fn) {
    if (toString.call(name) === objectType) {
      if (fn) { throw new Exception('Arg not supported with multiple helpers'); }
      Utils.extend(this.helpers, name);
    } else {
      this.helpers[name] = fn;
    }
  },
  unregisterHelper: function(name) {
    delete this.helpers[name];
  },

  registerPartial: function(name, partial) {
    if (toString.call(name) === objectType) {
      Utils.extend(this.partials,  name);
    } else {
      this.partials[name] = partial;
    }
  },
  unregisterPartial: function(name) {
    delete this.partials[name];
  }
};

function registerDefaultHelpers(instance) {
  instance.registerHelper('helperMissing', function(/* [args, ]options */) {
    if(arguments.length === 1) {
      // A missing field in a {{foo}} constuct.
      return undefined;
    } else {
      // Someone is actually trying to call something, blow up.
      throw new Exception("Missing helper: '" + arguments[arguments.length-1].name + "'");
    }
  });

  instance.registerHelper('blockHelperMissing', function(context, options) {
    var inverse = options.inverse,
        fn = options.fn;

    if(context === true) {
      return fn(this);
    } else if(context === false || context == null) {
      return inverse(this);
    } else if (isArray(context)) {
      if(context.length > 0) {
        if (options.ids) {
          options.ids = [options.name];
        }

        return instance.helpers.each(context, options);
      } else {
        return inverse(this);
      }
    } else {
      if (options.data && options.ids) {
        var data = createFrame(options.data);
        data.contextPath = Utils.appendContextPath(options.data.contextPath, options.name);
        options = {data: data};
      }

      return fn(context, options);
    }
  });

  instance.registerHelper('each', function(context, options) {
    if (!options) {
      throw new Exception('Must pass iterator to #each');
    }

    var fn = options.fn, inverse = options.inverse;
    var i = 0, ret = "", data;

    var contextPath;
    if (options.data && options.ids) {
      contextPath = Utils.appendContextPath(options.data.contextPath, options.ids[0]) + '.';
    }

    if (isFunction(context)) { context = context.call(this); }

    if (options.data) {
      data = createFrame(options.data);
    }

    if(context && typeof context === 'object') {
      if (isArray(context)) {
        for(var j = context.length; i<j; i++) {
          if (data) {
            data.index = i;
            data.first = (i === 0);
            data.last  = (i === (context.length-1));

            if (contextPath) {
              data.contextPath = contextPath + i;
            }
          }
          ret = ret + fn(context[i], { data: data });
        }
      } else {
        for(var key in context) {
          if(context.hasOwnProperty(key)) {
            if(data) {
              data.key = key;
              data.index = i;
              data.first = (i === 0);

              if (contextPath) {
                data.contextPath = contextPath + key;
              }
            }
            ret = ret + fn(context[key], {data: data});
            i++;
          }
        }
      }
    }

    if(i === 0){
      ret = inverse(this);
    }

    return ret;
  });

  instance.registerHelper('if', function(conditional, options) {
    if (isFunction(conditional)) { conditional = conditional.call(this); }

    // Default behavior is to render the positive path if the value is truthy and not empty.
    // The `includeZero` option may be set to treat the condtional as purely not empty based on the
    // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
    if ((!options.hash.includeZero && !conditional) || Utils.isEmpty(conditional)) {
      return options.inverse(this);
    } else {
      return options.fn(this);
    }
  });

  instance.registerHelper('unless', function(conditional, options) {
    return instance.helpers['if'].call(this, conditional, {fn: options.inverse, inverse: options.fn, hash: options.hash});
  });

  instance.registerHelper('with', function(context, options) {
    if (isFunction(context)) { context = context.call(this); }

    var fn = options.fn;

    if (!Utils.isEmpty(context)) {
      if (options.data && options.ids) {
        var data = createFrame(options.data);
        data.contextPath = Utils.appendContextPath(options.data.contextPath, options.ids[0]);
        options = {data:data};
      }

      return fn(context, options);
    } else {
      return options.inverse(this);
    }
  });

  instance.registerHelper('log', function(message, options) {
    var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
    instance.log(level, message);
  });

  instance.registerHelper('lookup', function(obj, field) {
    return obj && obj[field];
  });
}

var logger = {
  methodMap: { 0: 'debug', 1: 'info', 2: 'warn', 3: 'error' },

  // State enum
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  level: 3,

  // can be overridden in the host environment
  log: function(level, message) {
    if (logger.level <= level) {
      var method = logger.methodMap[level];
      if (typeof console !== 'undefined' && console[method]) {
        console[method].call(console, message);
      }
    }
  }
};
exports.logger = logger;
var log = logger.log;
exports.log = log;
var createFrame = function(object) {
  var frame = Utils.extend({}, object);
  frame._parent = object;
  return frame;
};
exports.createFrame = createFrame;
},{"./exception":98,"./utils":101}],98:[function(require,module,exports){
"use strict";

var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

function Exception(message, node) {
  var line;
  if (node && node.firstLine) {
    line = node.firstLine;

    message += ' - ' + line + ':' + node.firstColumn;
  }

  var tmp = Error.prototype.constructor.call(this, message);

  // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
  for (var idx = 0; idx < errorProps.length; idx++) {
    this[errorProps[idx]] = tmp[errorProps[idx]];
  }

  if (line) {
    this.lineNumber = line;
    this.column = node.firstColumn;
  }
}

Exception.prototype = new Error();

exports["default"] = Exception;
},{}],99:[function(require,module,exports){
"use strict";
var Utils = require("./utils");
var Exception = require("./exception")["default"];
var COMPILER_REVISION = require("./base").COMPILER_REVISION;
var REVISION_CHANGES = require("./base").REVISION_CHANGES;
var createFrame = require("./base").createFrame;

function checkRevision(compilerInfo) {
  var compilerRevision = compilerInfo && compilerInfo[0] || 1,
      currentRevision = COMPILER_REVISION;

  if (compilerRevision !== currentRevision) {
    if (compilerRevision < currentRevision) {
      var runtimeVersions = REVISION_CHANGES[currentRevision],
          compilerVersions = REVISION_CHANGES[compilerRevision];
      throw new Exception("Template was precompiled with an older version of Handlebars than the current runtime. "+
            "Please update your precompiler to a newer version ("+runtimeVersions+") or downgrade your runtime to an older version ("+compilerVersions+").");
    } else {
      // Use the embedded version info since the runtime doesn't know about this revision yet
      throw new Exception("Template was precompiled with a newer version of Handlebars than the current runtime. "+
            "Please update your runtime to a newer version ("+compilerInfo[1]+").");
    }
  }
}

exports.checkRevision = checkRevision;// TODO: Remove this line and break up compilePartial

function template(templateSpec, env) {
  /* istanbul ignore next */
  if (!env) {
    throw new Exception("No environment passed to template");
  }
  if (!templateSpec || !templateSpec.main) {
    throw new Exception('Unknown template object: ' + typeof templateSpec);
  }

  // Note: Using env.VM references rather than local var references throughout this section to allow
  // for external users to override these as psuedo-supported APIs.
  env.VM.checkRevision(templateSpec.compiler);

  var invokePartialWrapper = function(partial, indent, name, context, hash, helpers, partials, data, depths) {
    if (hash) {
      context = Utils.extend({}, context, hash);
    }

    var result = env.VM.invokePartial.call(this, partial, name, context, helpers, partials, data, depths);

    if (result == null && env.compile) {
      var options = { helpers: helpers, partials: partials, data: data, depths: depths };
      partials[name] = env.compile(partial, { data: data !== undefined, compat: templateSpec.compat }, env);
      result = partials[name](context, options);
    }
    if (result != null) {
      if (indent) {
        var lines = result.split('\n');
        for (var i = 0, l = lines.length; i < l; i++) {
          if (!lines[i] && i + 1 === l) {
            break;
          }

          lines[i] = indent + lines[i];
        }
        result = lines.join('\n');
      }
      return result;
    } else {
      throw new Exception("The partial " + name + " could not be compiled when running in runtime-only mode");
    }
  };

  // Just add water
  var container = {
    lookup: function(depths, name) {
      var len = depths.length;
      for (var i = 0; i < len; i++) {
        if (depths[i] && depths[i][name] != null) {
          return depths[i][name];
        }
      }
    },
    lambda: function(current, context) {
      return typeof current === 'function' ? current.call(context) : current;
    },

    escapeExpression: Utils.escapeExpression,
    invokePartial: invokePartialWrapper,

    fn: function(i) {
      return templateSpec[i];
    },

    programs: [],
    program: function(i, data, depths) {
      var programWrapper = this.programs[i],
          fn = this.fn(i);
      if (data || depths) {
        programWrapper = program(this, i, fn, data, depths);
      } else if (!programWrapper) {
        programWrapper = this.programs[i] = program(this, i, fn);
      }
      return programWrapper;
    },

    data: function(data, depth) {
      while (data && depth--) {
        data = data._parent;
      }
      return data;
    },
    merge: function(param, common) {
      var ret = param || common;

      if (param && common && (param !== common)) {
        ret = Utils.extend({}, common, param);
      }

      return ret;
    },

    noop: env.VM.noop,
    compilerInfo: templateSpec.compiler
  };

  var ret = function(context, options) {
    options = options || {};
    var data = options.data;

    ret._setup(options);
    if (!options.partial && templateSpec.useData) {
      data = initData(context, data);
    }
    var depths;
    if (templateSpec.useDepths) {
      depths = options.depths ? [context].concat(options.depths) : [context];
    }

    return templateSpec.main.call(container, context, container.helpers, container.partials, data, depths);
  };
  ret.isTop = true;

  ret._setup = function(options) {
    if (!options.partial) {
      container.helpers = container.merge(options.helpers, env.helpers);

      if (templateSpec.usePartial) {
        container.partials = container.merge(options.partials, env.partials);
      }
    } else {
      container.helpers = options.helpers;
      container.partials = options.partials;
    }
  };

  ret._child = function(i, data, depths) {
    if (templateSpec.useDepths && !depths) {
      throw new Exception('must pass parent depths');
    }

    return program(container, i, templateSpec[i], data, depths);
  };
  return ret;
}

exports.template = template;function program(container, i, fn, data, depths) {
  var prog = function(context, options) {
    options = options || {};

    return fn.call(container, context, container.helpers, container.partials, options.data || data, depths && [context].concat(depths));
  };
  prog.program = i;
  prog.depth = depths ? depths.length : 0;
  return prog;
}

exports.program = program;function invokePartial(partial, name, context, helpers, partials, data, depths) {
  var options = { partial: true, helpers: helpers, partials: partials, data: data, depths: depths };

  if(partial === undefined) {
    throw new Exception("The partial " + name + " could not be found");
  } else if(partial instanceof Function) {
    return partial(context, options);
  }
}

exports.invokePartial = invokePartial;function noop() { return ""; }

exports.noop = noop;function initData(context, data) {
  if (!data || !('root' in data)) {
    data = data ? createFrame(data) : {};
    data.root = context;
  }
  return data;
}
},{"./base":97,"./exception":98,"./utils":101}],100:[function(require,module,exports){
"use strict";
// Build out our basic SafeString type
function SafeString(string) {
  this.string = string;
}

SafeString.prototype.toString = function() {
  return "" + this.string;
};

exports["default"] = SafeString;
},{}],101:[function(require,module,exports){
"use strict";
/*jshint -W004 */
var SafeString = require("./safe-string")["default"];

var escape = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "`": "&#x60;"
};

var badChars = /[&<>"'`]/g;
var possible = /[&<>"'`]/;

function escapeChar(chr) {
  return escape[chr];
}

function extend(obj /* , ...source */) {
  for (var i = 1; i < arguments.length; i++) {
    for (var key in arguments[i]) {
      if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
        obj[key] = arguments[i][key];
      }
    }
  }

  return obj;
}

exports.extend = extend;var toString = Object.prototype.toString;
exports.toString = toString;
// Sourced from lodash
// https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
var isFunction = function(value) {
  return typeof value === 'function';
};
// fallback for older versions of Chrome and Safari
/* istanbul ignore next */
if (isFunction(/x/)) {
  isFunction = function(value) {
    return typeof value === 'function' && toString.call(value) === '[object Function]';
  };
}
var isFunction;
exports.isFunction = isFunction;
/* istanbul ignore next */
var isArray = Array.isArray || function(value) {
  return (value && typeof value === 'object') ? toString.call(value) === '[object Array]' : false;
};
exports.isArray = isArray;

function escapeExpression(string) {
  // don't escape SafeStrings, since they're already safe
  if (string instanceof SafeString) {
    return string.toString();
  } else if (string == null) {
    return "";
  } else if (!string) {
    return string + '';
  }

  // Force a string conversion as this will be done by the append regardless and
  // the regex test will do this transparently behind the scenes, causing issues if
  // an object's to string has escaped characters in it.
  string = "" + string;

  if(!possible.test(string)) { return string; }
  return string.replace(badChars, escapeChar);
}

exports.escapeExpression = escapeExpression;function isEmpty(value) {
  if (!value && value !== 0) {
    return true;
  } else if (isArray(value) && value.length === 0) {
    return true;
  } else {
    return false;
  }
}

exports.isEmpty = isEmpty;function appendContextPath(contextPath, id) {
  return (contextPath ? contextPath + '.' : '') + id;
}

exports.appendContextPath = appendContextPath;
},{"./safe-string":100}],102:[function(require,module,exports){
// Create a simple path alias to allow browserify to resolve
// the runtime on a supported path.
module.exports = require('./dist/cjs/handlebars.runtime');

},{"./dist/cjs/handlebars.runtime":96}],103:[function(require,module,exports){
module.exports = require("handlebars/runtime")["default"];

},{"handlebars/runtime":102}]},{},[6]);
