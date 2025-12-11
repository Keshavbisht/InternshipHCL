import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-objective',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './objective.html',
  styleUrls: ['./objective.css']
})
export class ObjectiveComponent implements OnInit {

  apiBase = "http://127.0.0.1:8000/api/auth";

  // Data arrays
  processes: any[] = [];
  subprocesses: any[] = [];
  objectives: any[] = [];

  // Form fields
  selectedProcess: number | null = null;
  selectedSubprocess: number | null = null;
  objectiveName: string = '';
  status: boolean = true;
  editingId: number | null = null;

  // Documents, Videos, Images
  documents: any[] = [];
  videos: any[] = [];
  images: any[] = [];
  selectedObjectiveId: number | null = null;

  // Upload forms
  documentTitle: string = '';
  documentFile: File | null = null;
  videoTitle: string = '';
  videoUrl: string = '';
  imageTitle: string = '';
  imageFile: File | null = null;

  // UI state
  activeTab: 'documents' | 'videos' | 'images' = 'documents';
  successMessage = '';
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProcesses();
    this.loadSubprocesses();
    this.loadObjectives();
  }

  // ========== PROCESS & SUBPROCESS ==========
  loadProcesses() {
    this.http.get(`${this.apiBase}/process/list/`).subscribe({
      next: (res: any) => {
        this.processes = res;
      },
      error: () => {
        this.errorMessage = "Failed to load processes.";
      }
    });
  }

  loadSubprocesses() {
    this.http.get(`${this.apiBase}/subprocess/list/`).subscribe({
      next: (res: any) => {
        this.subprocesses = res || [];
        console.log('Subprocesses loaded:', this.subprocesses);
      },
      error: (err) => {
        console.error('Error loading subprocesses:', err);
        this.errorMessage = "Failed to load subprocesses.";
        this.subprocesses = [];
      }
    });
  }

  // Filter subprocesses by selected process
  getFilteredSubprocesses() {
    if (!this.selectedProcess) {
      return [];
    }
    // Convert to number for comparison (select dropdown returns string)
    const selectedId = Number(this.selectedProcess);
    const filtered = this.subprocesses.filter(sp => Number(sp.process_id) === selectedId);
    console.log('Selected Process ID:', selectedId, 'Filtered Subprocesses:', filtered);
    return filtered;
  }

  // ========== OBJECTIVE CRUD ==========
  loadObjectives() {
    this.http.get(`${this.apiBase}/objective/list/`).subscribe({
      next: (res: any) => {
        this.objectives = res.data || res;
      },
      error: () => {
        this.errorMessage = "Failed to load objectives.";
      }
    });
  }

  saveObjective() {
    if (!this.selectedProcess || !this.selectedSubprocess || !this.objectiveName.trim()) {
      this.errorMessage = "Please fill all required fields.";
      return;
    }

    const body = {
      process_id: this.selectedProcess,
      subprocess_id: this.selectedSubprocess,
      objective_name: this.objectiveName,
      status: this.status ? "active" : "inactive"
    };

    if (this.editingId) {
      // UPDATE
      this.http.put(`${this.apiBase}/objective/${this.editingId}/update/`, body)
        .subscribe({
          next: () => {
            this.successMessage = "Objective updated successfully!";
            this.loadObjectives();
            this.clearObjectiveForm();
          },
          error: () => {
            this.errorMessage = "Failed to update objective.";
          }
        });
    } else {
      // CREATE
      this.http.post(`${this.apiBase}/objective/create/`, body)
        .subscribe({
          next: () => {
            this.successMessage = "Objective created successfully!";
            this.loadObjectives();
            this.clearObjectiveForm();
          },
          error: () => {
            this.errorMessage = "Failed to create objective.";
          }
        });
    }
  }

  editObjective(obj: any) {
    this.editingId = obj.objective_id;
    this.selectedProcess = obj.process_id;
    this.selectedSubprocess = obj.subprocess_id;
    this.objectiveName = obj.objective_name;
    this.status = obj.status === "active";
  }

  deleteObjective(id: number) {
    if (!confirm("Are you sure you want to delete this Objective?")) return;

    this.http.delete(`${this.apiBase}/objective/${id}/delete/`)
      .subscribe({
        next: () => {
          this.successMessage = "Objective deleted!";
          this.loadObjectives();
          if (this.selectedObjectiveId === id) {
            this.selectedObjectiveId = null;
            this.clearMedia();
          }
        },
        error: () => {
          this.errorMessage = "Failed to delete objective.";
        }
      });
  }

  clearObjectiveForm() {
    this.editingId = null;
    this.selectedProcess = null;
    this.selectedSubprocess = null;
    this.objectiveName = '';
    this.status = true;

    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 3000);
  }

  // ========== MEDIA MANAGEMENT ==========
  selectObjective(id: number) {
    this.selectedObjectiveId = id;
    this.loadDocuments(id);
    this.loadVideos(id);
    this.loadImages(id);
    this.activeTab = 'documents';
  }

  clearMedia() {
    this.documents = [];
    this.videos = [];
    this.images = [];
    this.selectedObjectiveId = null;
  }

  // ========== DOCUMENTS ==========
  loadDocuments(objectiveId: number) {
    this.http.get(`${this.apiBase}/document/${objectiveId}/list/`)
      .subscribe({
        next: (res: any) => {
          this.documents = res.documents || [];
        },
        error: () => {
          this.errorMessage = "Failed to load documents.";
        }
      });
  }

  onDocumentFileSelected(event: any) {
    this.documentFile = event.target.files[0];
  }

  uploadDocument() {
    if (!this.selectedObjectiveId || !this.documentFile) {
      this.errorMessage = "Please select an objective and a file.";
      return;
    }

    const formData = new FormData();
    formData.append('objective_id', this.selectedObjectiveId.toString());
    formData.append('file', this.documentFile);
    formData.append('title', this.documentTitle || this.documentFile.name);

    this.http.post(`${this.apiBase}/document/upload/`, formData)
      .subscribe({
        next: () => {
          this.successMessage = "Document uploaded successfully!";
          this.loadDocuments(this.selectedObjectiveId!);
          this.documentTitle = '';
          this.documentFile = null;
          // Reset file input
          const fileInput = document.querySelector('input[type="file"][name="document"]') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        },
        error: () => {
          this.errorMessage = "Failed to upload document.";
        }
      });
  }

  deleteDocument(id: number) {
    if (!confirm("Are you sure you want to delete this document?")) return;

    this.http.delete(`${this.apiBase}/document/${id}/delete/`)
      .subscribe({
        next: () => {
          this.successMessage = "Document deleted!";
          if (this.selectedObjectiveId) {
            this.loadDocuments(this.selectedObjectiveId);
          }
        },
        error: () => {
          this.errorMessage = "Failed to delete document.";
        }
      });
  }

  // ========== VIDEOS ==========
  loadVideos(objectiveId: number) {
    this.http.get(`${this.apiBase}/video/${objectiveId}/list/`)
      .subscribe({
        next: (res: any) => {
          this.videos = res.videos || [];
        },
        error: () => {
          this.errorMessage = "Failed to load videos.";
        }
      });
  }

  createVideo() {
    if (!this.selectedObjectiveId || !this.videoUrl.trim()) {
      this.errorMessage = "Please select an objective and enter a video URL.";
      return;
    }

    const body = {
      objective_id: this.selectedObjectiveId,
      title: this.videoTitle || "Untitled Video",
      video_url: this.videoUrl
    };

    this.http.post(`${this.apiBase}/video/create/`, body)
      .subscribe({
        next: () => {
          this.successMessage = "Video added successfully!";
          this.loadVideos(this.selectedObjectiveId!);
          this.videoTitle = '';
          this.videoUrl = '';
        },
        error: () => {
          this.errorMessage = "Failed to add video.";
        }
      });
  }

  deleteVideo(id: number) {
    if (!confirm("Are you sure you want to delete this video?")) return;

    this.http.delete(`${this.apiBase}/video/${id}/delete/`)
      .subscribe({
        next: () => {
          this.successMessage = "Video deleted!";
          if (this.selectedObjectiveId) {
            this.loadVideos(this.selectedObjectiveId);
          }
        },
        error: () => {
          this.errorMessage = "Failed to delete video.";
        }
      });
  }

  // ========== IMAGES ==========
  loadImages(objectiveId: number) {
    this.http.get(`${this.apiBase}/image/${objectiveId}/list/`)
      .subscribe({
        next: (res: any) => {
          this.images = res.images || [];
        },
        error: () => {
          this.errorMessage = "Failed to load images.";
        }
      });
  }

  onImageFileSelected(event: any) {
    this.imageFile = event.target.files[0];
  }

  uploadImage() {
    if (!this.selectedObjectiveId || !this.imageFile) {
      this.errorMessage = "Please select an objective and an image file.";
      return;
    }

    const formData = new FormData();
    formData.append('objective_id', this.selectedObjectiveId.toString());
    formData.append('image', this.imageFile);
    formData.append('title', this.imageTitle || this.imageFile.name);

    this.http.post(`${this.apiBase}/image/upload/`, formData)
      .subscribe({
        next: () => {
          this.successMessage = "Image uploaded successfully!";
          this.loadImages(this.selectedObjectiveId!);
          this.imageTitle = '';
          this.imageFile = null;
          // Reset file input
          const fileInput = document.querySelector('input[type="file"][name="image"]') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        },
        error: () => {
          this.errorMessage = "Failed to upload image.";
        }
      });
  }

  deleteImage(id: number) {
    if (!confirm("Are you sure you want to delete this image?")) return;

    this.http.delete(`${this.apiBase}/image/${id}/delete/`)
      .subscribe({
        next: () => {
          this.successMessage = "Image deleted!";
          if (this.selectedObjectiveId) {
            this.loadImages(this.selectedObjectiveId);
          }
        },
        error: () => {
          this.errorMessage = "Failed to delete image.";
        }
      });
  }

  // ========== UTILITY ==========
  getFullImageUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return `http://127.0.0.1:8000${url}`;
  }

  getFullDocumentUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return `http://127.0.0.1:8000${url}`;
  }
}

