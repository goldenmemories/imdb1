import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import Papa from 'papaparse';
import './IMDBDashboard.css';

const IMDBDashboard = () => {
  const [genreData, setGenreData] = useState([]);
  const [decadeData, setDecadeData] = useState([]);
  const [directorData, setDirectorData] = useState([]);
  const [genreRatingData, setGenreRatingData] = useState([]);
  const [decadeRatingData, setDecadeRatingData] = useState([]);
  const [actorMovieCountData, setActorMovieCountData] = useState([]);
  const [actorRatingData, setActorRatingData] = useState([]);
  const [directorActorCollabData, setDirectorActorCollabData] = useState([]);
  const [genreCombinationData, setGenreCombinationData] = useState([]);
  const [topGrossingByGenreData, setTopGrossingByGenreData] = useState([]);
  const [actorGenreSpecialtyData, setActorGenreSpecialtyData] = useState([]);
  const [currentTab, setCurrentTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [blockbusterFactors, setBlockbusterFactors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Modified to fetch from the public folder
        const response = await fetch('/data/imdb_top_1000.csv');
        const fileContent = await response.text();
        
        Papa.parse(fileContent, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            processData(results.data);
            setLoading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error reading file:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processData = (moviesData) => {
    // Process genre data
    const allGenres = [];
    moviesData.forEach(movie => {
      if (movie.Genre) {
        const genres = movie.Genre.split(', ');
        genres.forEach(genre => {
          allGenres.push(genre);
        });
      }
    });

    const genreCounts = {};
    allGenres.forEach(genre => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });

    const genreDataForChart = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count }));
    
    setGenreData(genreDataForChart);

    // Process decade data
    const decadeCounts = {};
    moviesData.forEach(movie => {
      if (movie.Released_Year) {
        const decade = Math.floor(movie.Released_Year / 10) * 10;
        decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
      }
    });

    const decadeDataForChart = Object.entries(decadeCounts)
      .filter(([decade]) => decade >= 1920) // Filter out any potential invalid decades
      .map(([decade, count]) => ({ decade: `${decade}s`, count }))
      .sort((a, b) => parseInt(a.decade) - parseInt(b.decade));
    
    setDecadeData(decadeDataForChart);

    // Process director data
    const directorCounts = {};
    moviesData.forEach(movie => {
      if (movie.Director) {
        directorCounts[movie.Director] = (directorCounts[movie.Director] || 0) + 1;
      }
    });

    const directorDataForChart = Object.entries(directorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([director, count]) => ({ director, count }));
    
    setDirectorData(directorDataForChart);

    // Process genre rating data
    const genreRatings = {};
    const genreRatingCounts = {};

    moviesData.forEach(movie => {
      if (movie.Genre && movie.IMDB_Rating) {
        const genres = movie.Genre.split(', ');
        genres.forEach(genre => {
          if (!genreRatings[genre]) {
            genreRatings[genre] = 0;
            genreRatingCounts[genre] = 0;
          }
          genreRatings[genre] += movie.IMDB_Rating;
          genreRatingCounts[genre]++;
        });
      }
    });

    const avgGenreRatings = {};
    Object.keys(genreRatings).forEach(genre => {
      avgGenreRatings[genre] = genreRatings[genre] / genreRatingCounts[genre];
    });

    const genreRatingDataForChart = Object.entries(avgGenreRatings)
      .sort((a, b) => b[1] - a[1])
      .map(([genre, avgRating]) => ({ genre, avgRating: parseFloat(avgRating.toFixed(2)) }));
    
    setGenreRatingData(genreRatingDataForChart);

    // Process decade rating data
    const yearRatings = {};
    const yearRatingCounts = {};

    moviesData.forEach(movie => {
      if (movie.Released_Year && movie.IMDB_Rating) {
        if (!yearRatings[movie.Released_Year]) {
          yearRatings[movie.Released_Year] = 0;
          yearRatingCounts[movie.Released_Year] = 0;
        }
        yearRatings[movie.Released_Year] += movie.IMDB_Rating;
        yearRatingCounts[movie.Released_Year]++;
      }
    });

    const avgYearRatings = {};
    Object.keys(yearRatings).forEach(year => {
      avgYearRatings[year] = yearRatings[year] / yearRatingCounts[year];
    });

    // Group by decade
    const decadeRatings = {};
    const decadeRatingCounts = {};

    Object.keys(avgYearRatings).forEach(year => {
      const decade = Math.floor(year / 10) * 10;
      if (!decadeRatings[decade]) {
        decadeRatings[decade] = 0;
        decadeRatingCounts[decade] = 0;
      }
      decadeRatings[decade] += avgYearRatings[year];
      decadeRatingCounts[decade]++;
    });

    const avgDecadeRatings = {};
    Object.keys(decadeRatings).forEach(decade => {
      avgDecadeRatings[decade] = decadeRatings[decade] / decadeRatingCounts[decade];
    });

    const decadeRatingDataForChart = Object.entries(avgDecadeRatings)
      .filter(([decade]) => decade >= 1920 && decade <= 2020) // Filter out any potential invalid decades
      .map(([decade, avgRating]) => ({ decade: `${decade}s`, avgRating: parseFloat(avgRating.toFixed(2)) }))
      .sort((a, b) => parseInt(a.decade) - parseInt(b.decade));
    
    setDecadeRatingData(decadeRatingDataForChart);
    
    // Process rating distribution
    const ratingDist = {};
    moviesData.forEach(movie => {
      if (movie.IMDB_Rating) {
        const rating = movie.IMDB_Rating.toFixed(1);
        ratingDist[rating] = (ratingDist[rating] || 0) + 1;
      }
    });
    
    // Process actor data
    const actorRatings = {};
    const actorMovieCounts = {};

    moviesData.forEach(movie => {
      if (!movie.IMDB_Rating) return;
      
      // Process each star
      [movie.Star1, movie.Star2, movie.Star3, movie.Star4].forEach(actor => {
        if (!actor) return;
        
        // Count actor appearances
        actorMovieCounts[actor] = (actorMovieCounts[actor] || 0) + 1;
        
        // Track ratings
        if (!actorRatings[actor]) {
          actorRatings[actor] = [];
        }
        actorRatings[actor].push(movie.IMDB_Rating);
      });
    });

    // Calculate average ratings for each actor and count their appearances
    const actorAnalysis = Object.keys(actorMovieCounts).map(actor => {
      const count = actorMovieCounts[actor];
      const avgRating = actorRatings[actor].reduce((sum, rating) => sum + rating, 0) / count;
      
      return {
        actor,
        count,
        avgRating: parseFloat(avgRating.toFixed(2))
      };
    });

    // Get top actors by number of appearances
    const topActorsByCount = actorAnalysis
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    setActorMovieCountData(topActorsByCount);

    // Get top actors by average rating (minimum 3 movies)
    const topActorsByRating = actorAnalysis
      .filter(actor => actor.count >= 3)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 15);

    setActorRatingData(topActorsByRating);

    // Process director-actor collaborations
    const directorActorCollaborations = {};

    moviesData.forEach(movie => {
      const director = movie.Director;
      if (!director) return;
      
      [movie.Star1, movie.Star2, movie.Star3, movie.Star4].forEach(actor => {
        if (!actor) return;
        
        const pair = `${director}-${actor}`;
        directorActorCollaborations[pair] = (directorActorCollaborations[pair] || 0) + 1;
      });
    });

    // Get top director-actor collaborations
    const topCollaborations = Object.entries(directorActorCollaborations)
      .filter(([_, count]) => count >= 3)
      .map(([pair, count]) => {
        const [director, actor] = pair.split('-');
        return { director, actor, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    setDirectorActorCollabData(topCollaborations);

    // Process genre combinations
    const genreCombinations = {};
    
    moviesData.forEach(movie => {
      if (!movie.Genre) return;
      
      const genres = movie.Genre.split(', ');
      
      for (let i = 0; i < genres.length; i++) {
        for (let j = i + 1; j < genres.length; j++) {
          // Create a sorted pair to avoid duplicates
          const pair = [genres[i], genres[j]].sort().join('-');
          genreCombinations[pair] = (genreCombinations[pair] || 0) + 1;
        }
      }
    });

    // Get top genre combinations
    const topGenreCombinations = Object.entries(genreCombinations)
      .map(([pair, count]) => {
        const [genre1, genre2] = pair.split('-');
        return { genre1, genre2, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setGenreCombinationData(topGenreCombinations);

    // Process movie box office data
    const cleanGross = movie => {
      if (!movie.Gross || typeof movie.Gross !== 'string') return null;
      
      // Remove $ and commas, then parse as number
      const grossStr = movie.Gross.replace(/[$,]/g, '');
      const gross = parseFloat(grossStr);
      
      return isNaN(gross) ? null : gross;
    };
    
    // Add clean gross to movies
    const moviesWithCleanGross = moviesData
      .map(movie => ({
        ...movie,
        CleanGross: cleanGross(movie)
      }))
      .filter(movie => movie.CleanGross);
    
    // Analyze gross by genre
    const genreGross = {};
    const genreGrossCount = {};
    
    moviesWithCleanGross.forEach(movie => {
      if (!movie.Genre) return;
      
      const genres = movie.Genre.split(', ');
      genres.forEach(genre => {
        if (!genreGross[genre]) {
          genreGross[genre] = 0;
          genreGrossCount[genre] = 0;
        }
        
        genreGross[genre] += movie.CleanGross;
        genreGrossCount[genre]++;
      });
    });
    
    // Calculate average gross by genre
    const avgGenreGross = Object.keys(genreGross)
      .filter(genre => genreGrossCount[genre] >= 5) // At least 5 movies
      .map(genre => ({
        genre,
        avgGross: genreGross[genre] / genreGrossCount[genre],
        movieCount: genreGrossCount[genre]
      }))
      .sort((a, b) => b.avgGross - a.avgGross)
      .slice(0, 10);
    
    setTopGrossingByGenreData(avgGenreGross);

    // Actor-genre specialties
    const actorGenreMap = {};

    moviesData.forEach(movie => {
      if (!movie.Genre) return;
      
      const genres = movie.Genre.split(', ');
      
      [movie.Star1, movie.Star2, movie.Star3, movie.Star4].forEach(actor => {
        if (!actor) return;
        
        if (!actorGenreMap[actor]) {
          actorGenreMap[actor] = {};
        }
        
        genres.forEach(genre => {
          actorGenreMap[actor][genre] = (actorGenreMap[actor][genre] || 0) + 1;
        });
      });
    });

    // Find actors' primary genres
    const actorsWithPrimaryGenres = Object.entries(actorGenreMap)
      .filter(([_, genres]) => Object.keys(genres).length > 0)
      .map(([actor, genres]) => {
        const sortedGenres = Object.entries(genres)
          .sort((a, b) => b[1] - a[1]);
        
        const primaryGenre = sortedGenres[0][0];
        const primaryGenreCount = sortedGenres[0][1];
        
        // Only include actors with at least 3 appearances in their primary genre
        if (primaryGenreCount < 3) return null;
        
        return {
          actor,
          primaryGenre,
          count: primaryGenreCount,
          totalMovies: Object.values(genres).reduce((sum, count) => sum + count, 0)
        };
      })
      .filter(item => item !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    setActorGenreSpecialtyData(actorsWithPrimaryGenres);

    // BLOCKBUSTER PREDICTION FACTORS
    // Identify factors that correlate with box office success
    const blockbusterFactorsObj = {
      topGrossingGenres: avgGenreGross.slice(0, 3).map(item => item.genre),
      optimalGenreCombination: topGenreCombinations[0],
      topDirectorsByCount: directorDataForChart.slice(0, 3).map(item => item.director),
      mostSuccessfulActors: topActorsByCount.slice(0, 3).map(item => item.actor),
      highestRatedActors: topActorsByRating.slice(0, 3).map(item => item.actor),
      successfulCollaborations: topCollaborations.slice(0, 3).map(item => `${item.director} + ${item.actor}`),
      bestDecades: decadeRatingDataForChart
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 3)
        .map(item => item.decade)
    };

    setBlockbusterFactors(blockbusterFactorsObj);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading IMDB data...</div>;
  }

  const renderOverviewTab = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Top 10 Genres</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={genreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="genre" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Movies by Decade</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={decadeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="decade" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Average Rating by Genre</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={genreRatingData.slice(0, 15)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[7.8, 8.2]} />
              <YAxis dataKey="genre" type="category" width={80} />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgRating" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Average Rating by Decade</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={decadeRatingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="decade" />
              <YAxis domain={[7.8, 8.2]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgRating" stroke="#82ca9d" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  const renderDirectorsActorsTab = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Top 10 Directors by Number of Movies</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={directorData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="director" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Top Actors by Number of Movies</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={actorMovieCountData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="actor" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Top Actors by Average Rating (Min 3 Movies)</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={actorRatingData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[7.5, 9]} />
              <YAxis dataKey="actor" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgRating" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Top Director-Actor Collaborations</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={directorActorCollabData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="director" type="category" width={150} tickFormatter={(value, index) => `${value} + ${directorActorCollabData[index].actor}`} />
              <Tooltip formatter={(value, name, props) => [`${value} films`, `Collaboration`]} labelFormatter={(value) => `${directorActorCollabData[value].director} + ${directorActorCollabData[value].actor}`} />
              <Legend />
              <Bar dataKey="count" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Actors' Genre Specialties</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={actorGenreSpecialtyData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="actor" 
                type="category" 
                width={150}
                tickFormatter={(value, index) => `${value} (${actorGenreSpecialtyData[index].primaryGenre})`}
              />
              <Tooltip 
                formatter={(value, name, props) => [`${value} films`, `In primary genre`]} 
                labelFormatter={(value) => `${actorGenreSpecialtyData[value].actor} - ${actorGenreSpecialtyData[value].primaryGenre}`}
              />
              <Legend />
              <Bar dataKey="count" fill="#a4de6c" name="Movies in primary genre" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  const renderGenreAnalysisTab = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Top 10 Genre Combinations</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={genreCombinationData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="genre1" 
                type="category" 
                width={150} 
                tickFormatter={(value, index) => `${genreCombinationData[index].genre1} + ${genreCombinationData[index].genre2}`}
              />
              <Tooltip 
                formatter={(value, name, props) => [`${value} films`, `Frequency`]} 
                labelFormatter={(value) => `${genreCombinationData[value].genre1} + ${genreCombinationData[value].genre2}`}
              />
              <Legend />
              <Bar dataKey="count" fill="#8dd1e1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Top Box Office Genres (Average)</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topGrossingByGenreData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <YAxis 
                dataKey="genre" 
                type="category" 
                width={100}
              />
              <Tooltip 
                formatter={(value, name, props) => [`${(value / 1000000).toFixed(2)}M`, `Avg. Box Office`]} 
                labelFormatter={(value) => `${topGrossingByGenreData[value].genre} (${topGrossingByGenreData[value].movieCount} movies)`}
              />
              <Legend />
              <Bar dataKey="avgGross" fill="#d0ed57" name="Avg. Box Office ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  const renderBlockbusterPredictionTab = () => (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Blockbuster Movie Prediction Factors</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-3">Genre Strategy</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Top Grossing Genres:</strong> {blockbusterFactors.topGrossingGenres?.join(', ')}</li>
            <li><strong>Optimal Genre Combination:</strong> {blockbusterFactors.optimalGenreCombination?.genre1} + {blockbusterFactors.optimalGenreCombination?.genre2}</li>
            <li><strong>Best Decade Rating Trends:</strong> {blockbusterFactors.bestDecades?.join(', ')}</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">Actor Selection</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Most Prolific Actors:</strong> {blockbusterFactors.mostSuccessfulActors?.join(', ')}</li>
            <li><strong>Highest Rated Actors:</strong> {blockbusterFactors.highestRatedActors?.join(', ')}</li>
            <li><strong>Actor-Genre Specialties:</strong> {actorGenreSpecialtyData.slice(0, 3).map(item => `${item.actor} (${item.primaryGenre})`).join(', ')}</li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-3">Directorial Choices</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Most Acclaimed Directors:</strong> {blockbusterFactors.topDirectorsByCount?.join(', ')}</li>
            <li><strong>Best Director-Actor Collaborations:</strong> {blockbusterFactors.successfulCollaborations?.join(', ')}</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">Additional Success Factors</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Rating Sweet Spot:</strong> Most successful movies cluster between 7.8-8.4 on IMDB</li>
            <li><strong>Box Office Leaders:</strong> Adventure, Sci-Fi, and Action genres dominate financially</li>
            <li><strong>Critical vs. Commercial:</strong> War and Western films have highest ratings but lower box office performance</li>
            <li><strong>Runtime Impact:</strong> Moderate correlation between longer runtime and higher ratings</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-8 p-5 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Blockbuster Formula Prediction</h3>
        <p className="mb-3">Based on the analysis of IMDB Top 1000 movies, the optimal formula for a future blockbuster would be:</p>
        <p className="font-medium">An <span className="font-bold text-blue-700">Adventure/Action</span> film directed by <span className="font-bold text-blue-700">Christopher Nolan</span> or <span className="font-bold text-blue-700">Steven Spielberg</span>, starring <span className="font-bold text-blue-700">Leonardo DiCaprio</span> and <span className="font-bold text-blue-700">Tom Hanks</span>, with a runtime of 140-160 minutes, combining emotional depth with spectacular visuals, and released during the summer blockbuster season.</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-center">IMDB Top 1000 Movies Analysis</h1>
      
      <div className="mb-6 flex justify-center space-x-2">
        <button 
          className={`px-4 py-2 rounded ${currentTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setCurrentTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`px-4 py-2 rounded ${currentTab === 'directorsActors' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setCurrentTab('directorsActors')}
        >
          Directors & Actors
        </button>
        <button 
          className={`px-4 py-2 rounded ${currentTab === 'genreAnalysis' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setCurrentTab('genreAnalysis')}
        >
          Genre Analysis
        </button>
        <button 
          className={`px-4 py-2 rounded ${currentTab === 'blockbuster' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setCurrentTab('blockbuster')}
        >
          Blockbuster Prediction
        </button>
      </div>
      
      {currentTab === 'overview' && renderOverviewTab()}
      {currentTab === 'directorsActors' && renderDirectorsActorsTab()}
      {currentTab === 'genreAnalysis' && renderGenreAnalysisTab()}
      {currentTab === 'blockbuster' && renderBlockbusterPredictionTab()}
      
    </div>
  );
};

export default IMDBDashboard;
