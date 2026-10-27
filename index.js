const [moviesGrid, searchForm, searchInput, sortSelect, resultsInfo] = [
  "moviesGrid",
  "searchForm",
  "searchInput",
  "sortSelect",
  "resultsInfo",
].map((id) => document.getElementById(id));

let movies = [];
let latestRequest = 0;

function showLoading() {
  moviesGrid.setAttribute("aria-busy", "true");
  sortSelect.disabled = true;
  moviesGrid.replaceChildren(...Array.from({ length: movies.length || 10 }, () => {
    const card = createElement("div", "movie-card movie-card--skeleton");
    card.setAttribute("aria-hidden", "true");
    card.innerHTML = `
      <div class="movie-card__img--skeleton"></div>
      <div class="movie-card__title--skeleton"></div>
      <div class="movie-card__year--skeleton"></div>`;
    return card;
  }));
}

async function getMovies(search = "marvel") {
  const request = ++latestRequest;
  movies = [];
  resultsInfo.setAttribute("role", "status");
  resultsInfo.textContent = `Loading movies: ${search}...`;
  showLoading();

  try {
    const response = await fetch(
      `https://www.omdbapi.com/?apikey=e0a17bf1&s=${encodeURIComponent(search)}`,
    );

    if (!response.ok) throw new Error("Could not connect. Please try again.");

    const data = await response.json();
    if (request !== latestRequest) return;

    if (data.Response === "False") throw new Error(data.Error);

    movies = data.Search;
    resultsInfo.textContent = `Showing: ${search}`;
    displayMovies();
  } catch (error) {
    if (request !== latestRequest) return;
    movies = [];
    moviesGrid.textContent = error.message;
    resultsInfo.textContent = "No results to display";
  } finally {
    if (request === latestRequest) {
      moviesGrid.setAttribute("aria-busy", "false");
      sortSelect.disabled = false;
    }
  }
}

function sortMovies(movies, sortBy) {
  return [...movies].sort((a, b) => {
    if (sortBy === "a-z") return a.Title.localeCompare(b.Title);
    if (sortBy === "z-a") return b.Title.localeCompare(a.Title);
    if (sortBy === "newest") return parseInt(b.Year) - parseInt(a.Year);
    if (sortBy === "oldest") return parseInt(a.Year) - parseInt(b.Year);
    return 0;
  });
}

function createElement(tag, className, text = "") {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function createPosterPlaceholder() {
  const placeholder = createElement("div", "movie-card__poster-placeholder");
  placeholder.innerHTML = "<span>Movie Poster<br>Not Available</span>";
  return placeholder;
}

function displayMovies() {
  const cards = sortMovies(movies, sortSelect.value).map((movie) => {
    const card = createElement("div", "movie-card");
    const placeholder = createPosterPlaceholder();
    let poster = placeholder;

    if (movie.Poster && movie.Poster !== "N/A") {
      poster = createElement("img", "movie-card__img");
      poster.alt = `${movie.Title} poster`;
      poster.addEventListener("error", () => poster.replaceWith(placeholder), {
        once: true,
      });
      poster.src = movie.Poster;
    }

    card.append(
      poster,
      createElement("h2", "movie-card__title", movie.Title),
      createElement("p", "movie-card__year", movie.Year),
    );
    return card;
  });
  moviesGrid.replaceChildren(...cards);
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const search = searchInput.value.trim();
  if (search) getMovies(search);
});

sortSelect.addEventListener("change", () => {
  if (!movies.length) return;
  const request = ++latestRequest;
  const previousInfo = resultsInfo.textContent;
  resultsInfo.textContent = "Sorting movies...";
  showLoading();
  setTimeout(() => {
    if (request !== latestRequest) return;
    displayMovies();
    resultsInfo.textContent = previousInfo;
    moviesGrid.setAttribute("aria-busy", "false");
    sortSelect.disabled = false;
  }, 500);
});

getMovies();
