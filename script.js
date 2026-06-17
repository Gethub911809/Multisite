function openPage(pageName) {
  // Hide all elements with class="tabcontent" by default
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Remove the background color of all tablinks/buttons
  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].style.backgroundColor = "";
  }

  var page = document.getElementById(pageName);
  if (page) {
    page.style.display = "block";
  }
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  var parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  if (!value) {
    return "";
  }
  return value.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function getAbsoluteUrl(href) {
  return new URL(href, window.location.href).href;
}

function createPostCard(post) {
  var card = document.createElement("div");
  card.className = "postflex latest";

  var section = document.createElement("div");
  section.className = "section";

  var title = document.createElement("h3");
  var link = document.createElement("a");
  link.href = post.href;
  link.textContent = post.title || post.href;
  title.appendChild(link);
  section.appendChild(title);

  if (post.type) {
    var typeLine = document.createElement("p");
    typeLine.className = "post-type";
    typeLine.textContent = post.type;
    section.appendChild(typeLine);
  }

  card.appendChild(section);

  if (post.image) {
    var imageWrapper = document.createElement("div");
    imageWrapper.className = "postimage";
    var img = document.createElement("img");
    img.className = "image";
    img.src = post.image;
    img.alt = post.title || "Post image";
    img.style.padding = "20px";
    imageWrapper.appendChild(img);
    card.appendChild(imageWrapper);
  }

  var excerpt = document.createElement("p");
  excerpt.className = "posttext";
  excerpt.textContent = post.description || "Read the full post to learn more.";
  card.appendChild(excerpt);

  return card;
}

function normalizeSectionId(sectionName) {
  if (!sectionName) {
    return "section-uncategorized";
  }
  return "section-" + sectionName.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
}

function renderPostsToContainer(containerId, posts, emptyMessage) {
  var container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  container.innerHTML = "";
  if (!posts || posts.length === 0) {
    container.innerHTML = "<p>" + emptyMessage + "</p>";
    return;
  }
  posts.forEach(function(post) {
    container.appendChild(createPostCard(post));
  });
}

function getPostMetadataFromLink(link) {
  var href = link.getAttribute("href");
  var title = link.dataset.title || link.textContent || href;
  var description = link.dataset.description ? link.dataset.description.trim() : "";
  var type = link.dataset.section ? link.dataset.section.trim() : "";
  var dateValue = link.dataset.date ? link.dataset.date.trim() : null;
  var image = link.dataset.image ? getAbsoluteUrl(link.dataset.image) : null;

  return {
    href: href,
    title: title.trim(),
    description: description.trim(),
    type: type || null,
    date: parseDate(dateValue),
    image: image,
    hasMetadata: Object.keys(link.dataset).length > 0
  };
}

async function fetchPostMetadata(href) {
  var url = getAbsoluteUrl(href);
  try {
    var response = await fetch(url);
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    var html = await response.text();
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, "text/html");

    var metaDate = doc.querySelector('meta[name="datePublished"], meta[property="article:published_time"]');
    var metaType = doc.querySelector('meta[name="articleSection"], meta[name="postType"], meta[property="article:section"]');
    var titleMeta = doc.querySelector('meta[name="title"]');
    var descriptionMeta = doc.querySelector('meta[name="description"]');
    var imageMeta = doc.querySelector('meta[property="og:image"], meta[name="image"], link[rel="image_src"]');

    var title = titleMeta ? titleMeta.getAttribute("content") : (doc.querySelector("title") ? doc.querySelector("title").textContent : href);
    var description = descriptionMeta ? descriptionMeta.getAttribute("content") : (doc.querySelector("p") ? doc.querySelector("p").textContent : "");
    var dateValue = metaDate ? metaDate.getAttribute("content") : null;
    var typeValue = metaType ? metaType.getAttribute("content") : null;
    var imageUrl = imageMeta ? imageMeta.getAttribute("content") : null;

    if (!imageUrl) {
      var firstImage = doc.querySelector("img");
      if (firstImage) {
        imageUrl = getAbsoluteUrl(firstImage.getAttribute("src"));
      }
    }

    return {
      href: href,
      title: title.trim(),
      description: description.trim(),
      date: parseDate(dateValue),
      type: typeValue ? typeValue.trim() : null,
      image: imageUrl ? getAbsoluteUrl(imageUrl) : null
    };
  } catch (error) {
    return {
      href: href,
      title: href,
      description: "Unable to load metadata: " + error.message,
      date: null,
      type: null,
      image: null
    };
  }
}

async function loadLatestPosts() {
  var links = Array.from(document.querySelectorAll("a.post-link"));
  if (links.length === 0) {
    renderPostsToContainer("section-new", [], "No post links were found. Add links with class=\"post-link\" to your page.");
    renderPostsToContainer("section-coding", [], "No coding posts yet.");
    renderPostsToContainer("section-rocketry", [], "No rocketry posts yet.");
    renderPostsToContainer("section-3d-printing", [], "No 3D printing posts yet.");
    renderPostsToContainer("section-film", [], "No film posts yet.");
    return;
  }

  var postPromises = links.map(function(link) {
    var localMeta = getPostMetadataFromLink(link);
    var shouldFetch = !localMeta.hasMetadata && !localMeta.href.startsWith("http");
    if (localMeta.hasMetadata || !shouldFetch) {
      return Promise.resolve(localMeta);
    }
    return fetchPostMetadata(localMeta.href).then(function(remoteMeta) {
      return {
        href: localMeta.href,
        title: localMeta.title || remoteMeta.title,
        description: localMeta.description || remoteMeta.description,
        date: localMeta.date || remoteMeta.date,
        type: localMeta.type || remoteMeta.type,
        image: localMeta.image || remoteMeta.image
      };
    });
  });

  var posts = await Promise.all(postPromises);

  var sorted = posts
    .filter(function(post) {
      return post.date !== null;
    })
    .sort(function(a, b) {
      return b.date - a.date;
    });

  renderPostsToContainer("section-new", sorted.slice(0, 3), "No valid posts with a published date were found.");

  var sectionPosts = {
    coding: [],
    rocketry: [],
    "3d-printing": [],
    film: []
  };

  posts.forEach(function(post) {
    var sectionKey = post.type ? post.type.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "") : "uncategorized";
    if (sectionPosts[sectionKey]) {
      sectionPosts[sectionKey].push(post);
    }
  });

  renderPostsToContainer("section-coding", sectionPosts.coding, "No coding posts yet.");
  renderPostsToContainer("section-rocketry", sectionPosts.rocketry, "No rocketry posts yet.");
  renderPostsToContainer("section-3d-printing", sectionPosts["3d-printing"], "No 3D printing posts yet.");
  renderPostsToContainer("section-film", sectionPosts.film, "No film posts yet.");
}

// Open the default tab after the DOM has loaded.
window.addEventListener("DOMContentLoaded", function() {
  var defaultOpen = document.getElementById("defaultOpen");
  if (defaultOpen) {
    defaultOpen.click();
  }
  loadLatestPosts();
});
