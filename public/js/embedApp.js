/*! 
* Hackdash - v0.10.1
* Copyright (c) 2017 Hackdash 
*  
*/ 


(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Embed Application
 *
 */

var EmbedRouter = require('./EmbedRouter');

module.exports = function(){

  var app = module.exports = new Backbone.Marionette.Application();

  app.source = "embed";

  function initRegions(){
    app.addRegions({
      header: "header",
      main: "#main",
      footer: "footer"
    });

    $('body').addClass('embedapp');
  }

  function initRouter(){
    app.router = new EmbedRouter();
    Backbone.history.start({ pushState: true });
  }

  app.addInitializer(initRegions);
  app.addInitializer(initRouter);

  window.hackdash.app = app;
  window.hackdash.app.start();
};
},{"./EmbedRouter":2}],2:[function(require,module,exports){
/*
 * Hackdash Router
 */

var Dashboard = require("./models/Dashboard")
  , Project = require("./models/Project")
  , Projects = require("./models/Projects")

  //, Header = require("./views/Header/Embed")

  , ProjectView = require("./views/Project/Embed")
  , DashboardView = require("./views/Dashboard/Embed")
  ;

module.exports = Backbone.Marionette.AppRouter.extend({

  routes : {

      "embed/dashboards/:dash": "showDashboard"
    , "embed/projects/:pid" : "showProject"

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
/*
          app.header.show(new Header({
            model: app.dashboard,
            collection: app.projects
          }));
*/
          app.main.show(new DashboardView({
            model: app.dashboard
          }));

        });
    });

  },

  showProject: function(pid){

    var app = window.hackdash.app;
    app.type = "project";

    app.project = new Project({ _id: pid });

    app.project.fetch().done(function(){
      app.main.show(new ProjectView({
        model: app.project
      }));
    });
  },

});

},{"./models/Dashboard":12,"./models/Project":13,"./models/Projects":14,"./views/Dashboard/Embed":18,"./views/Project/Embed":26}],3:[function(require,module,exports){

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

},{"hbsfy/runtime":36}],6:[function(require,module,exports){
jQuery(function() {
  require('./Initializer')();
  window.hackdash.startApp = require('./EmbedApp');
});
},{"./EmbedApp":1,"./Initializer":3}],7:[function(require,module,exports){
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


},{"./User":15,"./Users":16}],11:[function(require,module,exports){

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


},{"./Admins":10}],13:[function(require,module,exports){
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


},{}],14:[function(require,module,exports){
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

},{"./BaseCollection":11,"./Project":13}],15:[function(require,module,exports){
/**
 * MODEL: User
 *
 */

module.exports = Backbone.Model.extend({

  idAttribute: "_id",

});

},{}],16:[function(require,module,exports){
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


},{"./BaseCollection":11,"./User":15}],17:[function(require,module,exports){
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
},{"./templates/dashboard.hbs":19}],18:[function(require,module,exports){
/**
 * VIEW: Dashboard Projects Layout
 *
 */

var template = require('./templates/index.hbs')
  , DashboardView = require('./Dashboard')
  , ProjectsView = require('../Project/Collection')

// Slider View Mode
  , ProjectItemView = require('../Project/Card')
  , EntityList = require("../Home/EntityList")
  , ProjectListSlider = EntityList.extend({ childView: ProjectItemView });

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "page-ctn dashboard",
  template: template,

  regions: {
    "dashboard": ".dash-details",
    "projects": "#dashboard-projects",
  },

  templateHelpers: {
    hackdashURL: function(){
      return "//" + hackdash.baseURL;
    }
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    this.settings = this.getSettings();
  },

  onRender: function(){
    var self = this;

    var sort = hackdash.getQueryVariable('sort');
    var query = hackdash.getQueryVariable('query');
    var status = hackdash.getQueryVariable('status');
    var slider = hackdash.getQueryVariable('slider');

    if (query){
      hackdash.app.projects.search(query);
    }

    if (status){
      hackdash.app.projects.reset(
        hackdash.app.projects.where({ status: status })
      );
    }

    var dashboardView = new DashboardView({
      model: this.model
    });

    var projectsView;

    if (slider){
      this.$el.addClass('slider');

      if (sort){
        var s = '';

        switch(sort){
          case 'name': s = 'title'; break;
          case 'date': s = 'created_at'; break;
          case 'showcase': s = 'showcase'; break;
          default: s = 'created_at'; break;
        }

        if (s === 'showcase'){
          hackdash.app.projects = hackdash.app.projects.getActives();
        }

        hackdash.app.projects.runSort(s);
      }

      projectsView = new ProjectListSlider({
        model: this.model,
        collection: hackdash.app.projects,
        slides: parseInt(slider, 10)
      });
    }
    else {
      projectsView = new ProjectsView({
        model: this.model,
        collection: hackdash.app.projects,
        showcaseMode: false,
        showcaseSort: false
      });

      projectsView.on('ended:render', function(){
        if (sort){
          hackdash.app.projects.trigger("sort:" + sort);
        }
      });
    }

    dashboardView.on('show', function(){
      var ctn = self.dashboard.$el;

      if (!self.settings.title){
        $('h1', ctn).remove();
      }
      if (!self.settings.desc){
        $('p', ctn).remove();
      }
      if (!self.settings.logo){
        $('.logo', ctn).remove();
      }

      if (!self.settings.title && !self.settings.desc){
        $('.header', self.$el).addClass('hidden');
        $('.body .container', self.$el).css('margin-top', 0);
      }
    });

    projectsView.on('show', function(){
      var ctn = self.projects.$el;

      if (!self.settings.pprg){
        $('.progress', ctn).remove();
      }
      if (!self.settings.ptitle){
        $('.details h2', ctn).remove();
      }
      if (!self.settings.pcontrib){
        $('.contributors', ctn).remove();
      }
      if (!self.settings.pacnbar){
        $('.action-bar', ctn).remove();
      }
    });

    this.dashboard.show(dashboardView);
    this.projects.show(projectsView);

    _.defer(function(){
      $('.dash-admins, .dash-buttons, .inactive-ctn').remove();
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

  getSettings: function(){
    var settings = ['title', 'desc', 'logo', 'pprg', 'ptitle', 'pcontrib','pacnbar'];
    var hide = hackdash.getQueryVariable('hide');
    hide = (hide && hide.split(',')) || [];

    hide = _.difference(settings, hide);
    var values = _.range(hide.length).map(function () { return 1; });

    return _.object(hide, values);
  }


});
},{"../Home/EntityList":21,"../Project/Card":24,"../Project/Collection":25,"./Dashboard":17,"./templates/index.hbs":20}],19:[function(require,module,exports){
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

},{"hbsfy/runtime":36}],20:[function(require,module,exports){
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

},{"hbsfy/runtime":36}],21:[function(require,module,exports){
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
},{"./Item":22}],22:[function(require,module,exports){
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
},{"./templates/item.hbs":23}],23:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<div>"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "</div>";
},"useData":true});

},{"hbsfy/runtime":36}],24:[function(require,module,exports){
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

},{"../Home/Item.js":22,"./templates/card.hbs":27}],25:[function(require,module,exports){
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
},{"./Card":24}],26:[function(require,module,exports){
/**
 * VIEW: An Embed Project
 *
 */

var template = require('./templates/embed.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  id: function(){ return this.model.get("_id"); },

  tagName: 'a',
  className: 'entity project embed-project',
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    var url = "/projects/" + this.model.get("_id");
    this.$el.attr({
      'target': '_blank',
      'href': url
    });

    $('.tooltips', this.$el).tooltip({
      container: 'body',
      placement: 'top'
    });
  },

  serializeData: function(){
    return _.extend({
      settings: this.getSettings()
    }, this.model.toJSON());
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

  getSettings: function(){
    var settings = ['prg', 'pic', 'title', 'desc', 'contrib','acnbar'];
    var hide = hackdash.getQueryVariable('hide');
    hide = (hide && hide.split(',')) || [];

    hide = _.difference(settings, hide);
    var values = _.range(hide.length).map(function () { return 1; });

    return _.object(hide, values);
  }

});
},{"./templates/embed.hbs":28}],27:[function(require,module,exports){
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

},{"hbsfy/runtime":36}],28:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<div class=\"progress\" title=\""
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\">\r\n  <div class=\"progress-bar progress-bar-success progress-bar-striped "
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\" role=\"progressbar\">\r\n  </div>\r\n</div>\r\n";
},"3":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.cover : depth0), {"name":"if","hash":{},"fn":this.program(4, data),"inverse":this.program(6, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\r\n";
},"4":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <div class=\"item-cover\" style=\"background-image: url("
    + escapeExpression(((helper = (helper = helpers.cover || (depth0 != null ? depth0.cover : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"cover","hash":{},"data":data}) : helper)))
    + ");\"></div>\r\n";
},"6":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <i class=\"item-letter\">"
    + escapeExpression(((helpers.firstLetter || (depth0 && depth0.firstLetter) || helperMissing).call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"firstLetter","hash":{},"data":data})))
    + "</i>\r\n";
},"8":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <i class=\"item-letter\">"
    + escapeExpression(((helpers.firstLetter || (depth0 && depth0.firstLetter) || helperMissing).call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"firstLetter","hash":{},"data":data})))
    + "</i>\r\n";
},"10":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <div class=\"details\">\r\n    <div>\r\n      <h2>"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</h2>\r\n      <h3><a href=\"/dashboards/"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\">"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "</a></h3>\r\n    </div>\r\n  </div>\r\n";
},"12":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "<div class=\"description\">";
  stack1 = ((helpers.markdown || (depth0 && depth0.markdown) || helperMissing).call(depth0, (depth0 != null ? depth0.description : depth0), {"name":"markdown","hash":{},"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</div>\r\n";
},"14":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "<ul class=\"contributors\">\r\n";
  stack1 = ((helpers.each_upto || (depth0 && depth0.each_upto) || helperMissing).call(depth0, (depth0 != null ? depth0.contributors : depth0), 5, {"name":"each_upto","hash":{},"fn":this.program(15, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</ul>\r\n";
},"15":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <li>\r\n    <a href=\"/users/"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\">\r\n      "
    + escapeExpression(((helpers.getProfileImage || (depth0 && depth0.getProfileImage) || helperMissing).call(depth0, depth0, {"name":"getProfileImage","hash":{},"data":data})))
    + "\r\n    </a>\r\n  </li>\r\n";
},"17":function(depth0,helpers,partials,data) {
  var stack1, helper, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", lambda=this.lambda, buffer = "<div class=\"action-bar text-right\">\r\n\r\n  <i class=\"fa fa-clock-o timer tooltips\"\r\n    data-original-title=\""
    + escapeExpression(((helpers.timeAgo || (depth0 && depth0.timeAgo) || helperMissing).call(depth0, (depth0 != null ? depth0.created_at : depth0), {"name":"timeAgo","hash":{},"data":data})))
    + "\"></i>\r\n\r\n    <a href=\"/projects/"
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
    + "</a>\r\n\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.link : depth0), {"name":"if","hash":{},"fn":this.program(18, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</div>\r\n";
},"18":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <a class=\"demo-link\" href=\""
    + escapeExpression(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"link","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Demo", {"name":"__","hash":{},"data":data})))
    + "</a>\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\r\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.prg : stack1), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n<div class=\"cover\">\r\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.pic : stack1), {"name":"if","hash":{},"fn":this.program(3, data),"inverse":this.program(8, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.title : stack1), {"name":"if","hash":{},"fn":this.program(10, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n</div>\r\n\r\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.desc : stack1), {"name":"if","hash":{},"fn":this.program(12, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.contrib : stack1), {"name":"if","hash":{},"fn":this.program(14, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.acnbar : stack1), {"name":"if","hash":{},"fn":this.program(17, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"useData":true});

},{"hbsfy/runtime":36}],29:[function(require,module,exports){
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
},{"./handlebars/base":30,"./handlebars/exception":31,"./handlebars/runtime":32,"./handlebars/safe-string":33,"./handlebars/utils":34}],30:[function(require,module,exports){
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
},{"./exception":31,"./utils":34}],31:[function(require,module,exports){
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
},{}],32:[function(require,module,exports){
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
},{"./base":30,"./exception":31,"./utils":34}],33:[function(require,module,exports){
"use strict";
// Build out our basic SafeString type
function SafeString(string) {
  this.string = string;
}

SafeString.prototype.toString = function() {
  return "" + this.string;
};

exports["default"] = SafeString;
},{}],34:[function(require,module,exports){
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
},{"./safe-string":33}],35:[function(require,module,exports){
// Create a simple path alias to allow browserify to resolve
// the runtime on a supported path.
module.exports = require('./dist/cjs/handlebars.runtime');

},{"./dist/cjs/handlebars.runtime":29}],36:[function(require,module,exports){
module.exports = require("handlebars/runtime")["default"];

},{"handlebars/runtime":35}]},{},[6]);
