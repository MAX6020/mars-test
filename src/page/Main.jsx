import "./Main.css";
import { useEffect, useRef, useState } from "react";
import * as XLSX from 'xlsx'
import axios from "axios";

let chunkSize = 1 * 1024;

const Main = () => {
  const [dropzoneActive, setDropzoneActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [lastUploadFileIndex, setLastUploadedFileIndex] = useState(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(null);
  const fileRef = useRef()

  function handleDrop(e) {
    e.preventDefault();
    setFiles([...files, ...e.dataTransfer.files]);
  }

  function handleUpload(e) {
    e.preventDefault();
    setFiles([...files, ...e.target.files]);
  }

  function readAndUploadCurrentChunk() {
    const reader = new FileReader();
    const file = files[currentFileIndex];
    if (!file) {
      return;
    }
    chunkSize = Math.ceil(file.size / 100);
    const from = currentChunkIndex * chunkSize;
    const to = from + chunkSize;
    const blob = file.slice(from, to);
    reader.onload = (e) => uploadChunck(e);
    reader.readAsDataURL(blob);
  }

  function uploadChunck(readerEvent) {
    const file = files[currentFileIndex];
    const data = readerEvent.target.result;
    const params = new URLSearchParams();
    params.set("name", file.name);
    params.set("size", file.size);
    params.set("currentChunkIndex", currentChunkIndex);
    params.set("totalChunks", Math.ceil(file.size / chunkSize));
    const headers = { "Content-Type": "application/octet-stream" };
    const url = "http://localhost:4001/upload?" + params.toString();
    axios.post(url, data, { headers }).then((response) => {
      const file = files[currentFileIndex];
      const filesize = files[currentFileIndex].size;
      const chunks = Math.ceil(filesize / chunkSize) - 1;
      const isLastChunk = currentChunkIndex === chunks;
      if (isLastChunk) {
        file.finalFilename = response.data.finalFilename;
        setLastUploadedFileIndex(currentFileIndex);
        setCurrentChunkIndex(null);
      } else {
        setCurrentChunkIndex(currentChunkIndex + 1);
      }
    });
  }

  const handleClick = () =>{
    fileRef.current.click()
  }

  const handleChange = (e) => {
    e.preventDefault();

    var files = e.target.files, f = files[0];
    var reader1 = new FileReader();
    reader1.onload = function (e) {
        var data = e.target.result;
        let readedData = XLSX.read(data, {type: 'binary'});
        const wsname = readedData.SheetNames[0];
        const ws = readedData.Sheets[wsname];

        /* Convert array to json*/
        const dataParse = XLSX.utils.sheet_to_json(ws, {header:1});
        console.log(dataParse)
    };
    reader1.readAsBinaryString(f)
}

  useEffect(() => {
    if (lastUploadFileIndex === null) {
      return;
    }
    const isLastFile = lastUploadFileIndex === files.length - 1;
    const nextFileIndex = isLastFile ? null : currentFileIndex + 1;
    setCurrentFileIndex(nextFileIndex);
  }, [lastUploadFileIndex]);

  useEffect(() => {
    if (files.length > 0) {
      if (currentFileIndex === null) {
        setCurrentFileIndex(
          lastUploadFileIndex === null ? 0 : lastUploadFileIndex + 1
        );
      }
    }
  }, [files.length]);

  useEffect(() => {
    if (currentFileIndex !== null) {
      setCurrentChunkIndex(0);
    }
  }, [currentFileIndex]);

  useEffect(() => {
    if (currentChunkIndex !== null) {
      readAndUploadCurrentChunk();
    }
  }, [currentChunkIndex]);
  return (
    <>
      <header className="header">
        <div className="container">
          <h1 className="head">Загрузчик</h1>
        </div>
      </header>
      <main className="container">
        <div className="uploader">
          <input onChange={handleUpload} type="file" id="file" />
          <label htmlFor="file" className="btn" id="btn__open">
            Выбрать файл
          </label>
          <div
            onDragOver={(e) => {
              setDropzoneActive(true);
              e.preventDefault();
            }}
            onDragLeave={(e) => {
              setDropzoneActive(false);
              e.preventDefault();
            }}
            onDrop={(e) => handleDrop(e)}
            className={"dropzone " + (dropzoneActive ? "active" : "")}
          >
            Перетащите файл сюда
          </div>
        </div>
        <div className="uploader">
          <h1 className="head">Загруженные файлы</h1>
          <div className="files">
            {files.map((file, fileIndex) => {
              let progress = 0;
              let uploadedFileSize = 0;
              if (file.finalFilename) {
                progress = 100;
                uploadedFileSize = file.size
              } else {
                const uploading = fileIndex === currentFileIndex;
                const chunks = Math.ceil(file.size / chunkSize);
                
                if (uploading) {
                  uploadedFileSize = Math.ceil(file.size / chunks) * currentChunkIndex;
                  progress = Math.round((currentChunkIndex / chunks) * 100);
                } else {
                  progress = 0;
                }
              }
              return (
                <div className="progress__upload">
                <a key={fileIndex}
                  className="file"
                  target="_blank"
                  href={"http://localhost:4001/uploads/" + file.finalFilename}
                >
                  <div className="name">{file.name}</div>
                  <div
                    className={"progress " + (progress === 100 ? "done" : "")}
                    style={{ width: progress + "%" }}
                  >
                  </div><div className="prom__upload"><p className={"upload__text " + (progress === 100 ? "up" : "")}>Done</p></div>
                </a>
                <div className="byte__flex"><div key={fileIndex} className="byte">{uploadedFileSize}/{file.size}</div></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="uploader">
          <div className="statistic">
            <h1 className="head">Статистика</h1>
            <button 
            className="btn"
            onClick={handleClick}
            >
              Выгрузить таблицу
            </button>
            <input 
            type="file" 
            ref={fileRef} 
            onChange={handleChange} 
            style={{display:'none'}}
            />
          </div>
        </div>
      </main>
    </>
  );
};

export default Main;
