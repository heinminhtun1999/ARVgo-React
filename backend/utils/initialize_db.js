async function initializeDB(sql) {
    try {

        await sql`CREATE TABLE IF NOT EXISTS albums 
                  (
                      id SERIAL PRIMARY KEY,
                      name TEXT NOT NULL,
                      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                  )`

        await sql`CREATE TABLE IF NOT EXISTS posts
                  (
                      id SERIAL PRIMARY KEY,
                      title TEXT NOT NULL CHECK (char_length(title) > 0),
                      content TEXT NOT NULL CHECK (char_length(content) > 0),
                      event_date TIMESTAMP,
                      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                      album_id INTEGER,
                      CONSTRAINT fk_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL
                  )`

        await sql`CREATE TABLE IF NOT EXISTS images 
              (
                  id SERIAL PRIMARY KEY,
                  url TEXT NOT NULL,
                  album_id INTEGER,
                  post_id INTEGER,
                  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  CONSTRAINT fk_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,
                  CONSTRAINT fk_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL
              )`

        await sql`CREATE TABLE IF NOT EXISTS videos 
              (
                  id SERIAL PRIMARY KEY,
                  title TEXT NOT NULL,
                  public BOOLEAN NOT NULL DEFAULT FALSE,
                  description TEXT,
                  url  TEXT NOT NULL,
                  album_id INTEGER,
                  post_id INTEGER,
                  event_date TIMESTAMP,
                  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  CONSTRAINT fk_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,
                  CONSTRAINT fk_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL
              )`

        await sql`CREATE TABLE IF NOT EXISTS agreement_files
                  (
                      id SERIAL PRIMARY KEY,
                      name VARCHAR(255) NOT NULL,
                      url  TEXT NOT NULL,
                      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                  )`

        console.log("-".repeat(47));
        console.log("Database initialized successfully. 🫡  🫡  🫡  🫡");
        console.log("-".repeat(47) + "\n".repeat(5));
    }
    catch (error) {
        console.log(error);
    }
}

module.exports = initializeDB;