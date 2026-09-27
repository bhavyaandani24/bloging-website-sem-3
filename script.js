// My Portfolio + Blog site - handles posts and simple login/register using localStorage

var POSTS_KEY = "portfolioBlogPosts";
var USERS_KEY = "portfolioUsers";
var CURRENT_USER_KEY = "portfolioCurrentUser";

// ---------------- POSTS HELPERS ----------------

function getPosts() {
  var data = localStorage.getItem(POSTS_KEY);
  if (!data) {
    return [];
  }
  return JSON.parse(data);
}

function savePosts(posts) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

function formatDate(dateString) {
  var d = new Date(dateString);
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
}

function makeExcerpt(text) {
  if (text.length <= 150) {
    return text;
  }
  return text.substring(0, 150) + "...";
}

function escapeHtml(text) {
  var div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ---------------- USERS / AUTH HELPERS ----------------

function getUsers() {
  var data = localStorage.getItem(USERS_KEY);
  if (!data) {
    return [];
  }
  return JSON.parse(data);
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  var data = localStorage.getItem(CURRENT_USER_KEY);
  if (!data) {
    return null;
  }
  return JSON.parse(data);
}

function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
  window.location.href = "index.html";
}

// shows "Login | Register" or "Hi, Name | Logout" in the nav bar on every page
function updateNavAuth() {
  var slot = document.getElementById("nav-auth");
  if (!slot) {
    return;
  }

  var user = getCurrentUser();

  if (user) {
    slot.innerHTML = "<span>Hi, " + escapeHtml(user.name) + "</span> <a href='#' id='logout-link'>Logout</a>";
    document.getElementById("logout-link").addEventListener("click", function (e) {
      e.preventDefault();
      logoutUser();
    });
  } else {
    slot.innerHTML = "<a href='login.html'>Login</a><a href='register.html'>Register</a>";
  }
}

// ---------------- REGISTER PAGE ----------------

function setupRegisterForm() {
  var form = document.getElementById("register-form");
  if (!form) {
    return;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var name = document.getElementById("reg-name").value.trim();
    var email = document.getElementById("reg-email").value.trim().toLowerCase();
    var password = document.getElementById("reg-password").value;

    if (name === "" || email === "" || password === "") {
      alert("Please fill in all fields.");
      return;
    }

    var users = getUsers();

    var alreadyExists = users.some(function (u) {
      return u.email === email;
    });

    if (alreadyExists) {
      alert("An account with this email already exists. Please login instead.");
      return;
    }

    var newUser = {
      name: name,
      email: email,
      password: password // note: plain text, this is just a school project demo, not real security
    };

    users.push(newUser);
    saveUsers(users);

    // log the user in right away after registering
    setCurrentUser({ name: newUser.name, email: newUser.email });

    alert("Account created! You are now logged in.");
    window.location.href = "index.html";
  });
}

// ---------------- LOGIN PAGE ----------------

function setupLoginForm() {
  var form = document.getElementById("login-form");
  if (!form) {
    return;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var email = document.getElementById("login-email").value.trim().toLowerCase();
    var password = document.getElementById("login-password").value;

    var users = getUsers();
    var matchedUser = null;

    for (var i = 0; i < users.length; i++) {
      if (users[i].email === email && users[i].password === password) {
        matchedUser = users[i];
        break;
      }
    }

    if (!matchedUser) {
      alert("Incorrect email or password.");
      return;
    }

    setCurrentUser({ name: matchedUser.name, email: matchedUser.email });
    window.location.href = "index.html";
  });
}

// ---------------- BLOG LIST PAGE ----------------

function loadBlogPage() {
  var postsContainer = document.getElementById("posts-container");
  if (!postsContainer) {
    return;
  }

  var posts = getPosts();

  if (posts.length === 0) {
    postsContainer.innerHTML = "<p class='empty-msg'>No blog posts yet. Login and click 'Write a Post' to add the first one!</p>";
    return;
  }

  posts.sort(function (a, b) {
    return b.id - a.id;
  });

  var html = "";
  for (var i = 0; i < posts.length; i++) {
    var post = posts[i];
    html += "<div class='post-card'>";
    html += "<h2>" + escapeHtml(post.title) + "</h2>";
    html += "<div class='meta'>By " + escapeHtml(post.author) + " on " + formatDate(post.date) + "</div>";
    html += "<p>" + escapeHtml(makeExcerpt(post.content)) + "</p>";
    html += "<a class='read-more' href='post.html?id=" + post.id + "'>Read More &rarr;</a>";
    html += "</div>";
  }

  postsContainer.innerHTML = html;
}

// ---------------- WRITE PAGE (login required) ----------------

function setupWritePage() {
  var form = document.getElementById("write-form");
  var loginNotice = document.getElementById("login-notice");

  if (!form && !loginNotice) {
    return; // not on write page
  }

  var user = getCurrentUser();

  if (!user) {
    // not logged in - hide the form and show a message instead
    if (form) form.style.display = "none";
    if (loginNotice) loginNotice.style.display = "block";
    return;
  }

  if (loginNotice) loginNotice.style.display = "none";
  if (form) form.style.display = "block";

  var authorField = document.getElementById("write-author-name");
  if (authorField) {
    authorField.textContent = user.name;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var title = document.getElementById("title").value.trim();
    var content = document.getElementById("content").value.trim();

    if (title === "" || content === "") {
      alert("Please fill in the title and story before publishing.");
      return;
    }

    var posts = getPosts();

    var newPost = {
      id: Date.now(),
      title: title,
      author: user.name,
      content: content,
      date: new Date().toISOString()
    };

    posts.push(newPost);
    savePosts(posts);

    window.location.href = "blog.html";
  });
}

// ---------------- SINGLE POST PAGE ----------------

function loadSinglePost() {
  var container = document.getElementById("post-container");
  if (!container) {
    return;
  }

  var params = new URLSearchParams(window.location.search);
  var postId = Number(params.get("id"));

  var posts = getPosts();
  var post = null;
  for (var i = 0; i < posts.length; i++) {
    if (posts[i].id === postId) {
      post = posts[i];
      break;
    }
  }

  if (!post) {
    container.innerHTML = "<p class='empty-msg'>Sorry, this post could not be found.</p>";
    return;
  }

  var html = "<div class='post-full'>";
  html += "<h2>" + escapeHtml(post.title) + "</h2>";
  html += "<div class='meta'>By " + escapeHtml(post.author) + " on " + formatDate(post.date) + "</div>";
  html += "<div class='content'>" + escapeHtml(post.content) + "</div>";
  html += "<div class='actions'>";
  html += "<a class='btn btn-secondary' href='blog.html'>Back to Blog</a>";

  var user = getCurrentUser();
  if (user && user.name === post.author) {
    html += "<button id='delete-btn' class='btn-danger'>Delete Post</button>";
  }

  html += "</div>";
  html += "</div>";

  container.innerHTML = html;

  var deleteBtn = document.getElementById("delete-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", function () {
      var confirmDelete = confirm("Are you sure you want to delete this post?");
      if (confirmDelete) {
        deletePost(postId);
      }
    });
  }
}

function deletePost(postId) {
  var posts = getPosts();
  var updatedPosts = posts.filter(function (p) {
    return p.id !== postId;
  });
  savePosts(updatedPosts);
  window.location.href = "blog.html";
}

// ---------------- RUN ON EVERY PAGE ----------------

updateNavAuth();
loadBlogPage();
setupWritePage();
loadSinglePost();
setupRegisterForm();
setupLoginForm();
