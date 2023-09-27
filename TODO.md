# TODO

* ! uncomment tableland upload at process.ts

## UI
* Search recordings
* Show recordings
* Play recordings
* Show cams on map


### Phase 2
* process by lillypad AI
* add events to evt table


## Run same on IPC
* create new subnet
* deploy ipc node
* deploy tableland contracts to the node
* add subnet configs to tableland validator

## Presentation
* Describe project and architecture


## Tables
All tables are not mutable. Insertable by any sender.

### recs - recordings
* stp txt - time stamp (row added)
* snd txt - sender 
* cam txt - sender camera id 
* cid txt - file cid (unique)
* stt int - recording time start 
* end int - recording time end 

### *evts - events (events, objects, persons etc., detected on recordings)
* stp txt - time stamp (row added)
* snd txt - sender 
* cam txt - sender camera id 
* cid txt - file cid 
* tim int - event time 
* typ txt - event type 
* val txt - event value 

# ffmpeg

ffmpeg -hide_banner -y -loglevel error -use_wallclock_as_timestamps 1 -i http://60.45.181.202:8080/mjpg/video.mjpg -vcodec copy -acodec copy -f segment -reset_timestamps 1 -segment_time 10 -segment_format mkv -strftime 1 -strftime_mkdir 1 recs/cam1_%Y-%m-%dT%H-%M-%S.mkv
ffmpeg -hide_banner -y -loglevel error -rtsp_transport tcp -use_wallclock_as_timestamps 1 -i rtsp://username:password@192.168.1.123:554/stream1 -vcodec copy -acodec copy -f segment -reset_timestamps 1 -segment_time 900 -segment_format mp4 -strftime 1 cam1_%Y-%m-%d_T%H-%M-%S.mkv

ffmpeg -f mjpeg -r 5 -i "http://172.17.2.101:8080/stream.mjpg?fps=10" -r 10 ./video.avi
ffmpeg -i source_file.mov -pix_fmt yuv420p -b:v 4000k -c:v libx264 destination_file.mp4

# Open Cameras
Google search: https://www.google.com/search?q=inurl%3Amjpg%2Fvideo.mjpg

* Soka, Japan http://60.45.181.202:8080/mjpg/video.mjpg
* Lviv, Ukraine http://194.44.38.196:8083/mjpg/video.mjpg
* * http://webcam.zvnoordwijk.nl:82/mjpg/video.mjpg

# Deployed contracts
-------------------

Sisters Contract deployed to '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853'.

* Recordings Table name 'recs_31337_2' minted to contract.
* Events     Table name 'evts_31337_3' minted to contract.

## View tables data
http://localhost:8080/api/v1/query?statement=select%20%2A%20from%20recs_31337_2
http://localhost:8080/api/v1/query?statement=select%20%2A%20from%20evts_31337_3


 

