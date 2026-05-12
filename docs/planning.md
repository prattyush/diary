# Online Diary Project
This is a online diary project which allows users to write anything they want to write and attach pictures against a particular day. Users can also tag some pre-defined tags to their diary entries. Each users entry will only be visible to them and not to others. The platform will be login based and will persist the diary entries.


## Development process

When instructed to build a feature:
1. Develop the feature - do not skip any step from the feature-dev 7 step process
2. Thoroughly test the feature with unit tests and integration tests and fix any issues
3. Submit a PR using your github tools.


## Feature List
Below are the list of features described. Each Feature has a label in front, use that label to inform the status of the feature and any issues detected in it.

### Basic — STATUS: COMPLETE (merged to feature/basic-ui, PR submitted)
An MVP of just the frontend with the following capabilities:-
1. The UI shows a calendar and on clicking a particular date, the users can write anything and attach picture. 
2. There is an option for users to provide a UI template which is just headings under which they are make diary entries in the respective days. If a template is provided then each day opens with that template. The templates are defined by each user how they want it. These templates are not global or defined by admin.
3. Users can delete diary entries for a particular day.
4. For Frontend framework use react and NextJS.
5. Create docker compose as you seem fit.
6. The diary entry panel has a view mode and an edit mode. If no entry exists for a date, a blank state is shown with an Edit button to start writing. If an entry exists, the saved content is displayed in read-only view with an Edit button to switch to edit mode.
7. Users can attach a single image to a diary entry. In edit mode an "Add photo" button opens a file picker; the chosen image is shown as a small preview with an option to remove or replace it. In view mode the image thumbnail is shown below the text; clicking the thumbnail opens it in a full-screen lightbox overlay (click outside or press Escape to close). The calendar dot also appears for days that have an image but no text. Images are stored as base64 data URLs in localStorage (will move to backend storage in the Backend phase).

**Implementation notes:**
- Frontend lives in `frontend/` as a Next.js 15 app (upgraded to 15.3.9 to patch CVE-2025-66478).
- Diary entries and templates are persisted via `localStorage` (no backend yet).
- Docker Compose included at project root.
- View/edit mode added to `DiaryEditor` component: dates with no entry show a blank state + Edit button; dates with an entry show the content read-only + Edit button to switch to edit mode.
- Image upload uses native `FileReader` API (no extra dependencies); stored as base64 on `DiaryEntry.image`.
- Lightbox is a fixed full-screen overlay rendered inside `DiaryEditor`; closes on backdrop click or Escape key.

**How to start the dev server (WSL2 / Windows `/mnt/d/` path):**
```bash
cd frontend
npm install --no-bin-links   # only needed once after fresh clone; --no-bin-links required on Windows FS
node node_modules/next/dist/bin/next dev &
```
- Do NOT use `npm run dev` — the `next` symlink in `.bin/` cannot be created on a Windows filesystem from WSL2.
- After a PC restart port 3000 is free and the `.next` cache is clean, so the server starts cleanly.
- If the `.next` directory gets into a bad state, delete its contents manually and restart the server.


### Backend
In this phase add the backend to presist those diary entries and also store the images attached in a directory. You can create a directory in home folder to store the images if you want. Also, make sure that these images are of unique names, if any duplicates modify them by adding any suitable suffix. Also, add a database support to store the images against the dates which they are uploaded so that they can be fetched and displayed back when required. Store the SQLLite db in db folder created in home directory. 

### Login
In this phase, display a login screen for the users, and only after login in display there respective diary entries. The system should support signing up and signin feature if the user is already registered. Make sure to store the user and password in a consistent storage and passed encrypted if required. You can use store any cookie for recording that the user is logged in.

### AWS
In this phase, add support to enable storage of the images in S3. The S3 credentials will be present in .env file. 


## Technical design

The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite.
Consider statically building the frontend and serving it via FastAPI, if that will work.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8700


