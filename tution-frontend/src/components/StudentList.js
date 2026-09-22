import React, { useState, useEffect, useRef } from 'react'; // --- ADDED useRef ---
import axios from 'axios';
import { Container, Spinner, Alert, Card, Table, Form, Row, Col, Badge, Button, Modal } from 'react-bootstrap';
import { FaEdit, FaTrashAlt, FaQrcode } from 'react-icons/fa';
import QRCode from "react-qr-code";
import { toJpeg } from 'html-to-image'; // --- ADDED THIS IMPORT ---

function StudentList({ refreshKey, onListRefresh }) {
    // --- State ---
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [gradeFilter, setGradeFilter] = useState('All');
    const [locationFilter, setLocationFilter] = useState('All');
    const [locations, setLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrStudent, setQrStudent] = useState(null);

    // --- NEW: Create a Ref for the download area ---
    const qrCodeRef = useRef(null);

    // --- Fetch Students (Uses Env Var) ---
    useEffect(() => {
        const fetchStudents = async () => { /* ... unchanged ... */
            setLoading(true); setError(null); try { const apiUrl = process.env.REACT_APP_API_URL; if (!apiUrl) throw new Error("API URL not configured."); const response = await axios.get(`${apiUrl}/api/students`); setStudents(response.data); } catch (err) { console.error("Error fetching students:", err); setError(`Error fetching students: ${err.message}`); } finally { setLoading(false); }
        };
        fetchStudents();
    }, [refreshKey]);

    // --- Fetch Locations (Uses Env Var) ---
    useEffect(() => {
        const fetchLocations = async () => { /* ... unchanged ... */
            setLocationLoading(true); try { const apiUrl = process.env.REACT_APP_API_URL; if (!apiUrl) throw new Error("API URL not configured."); const res = await axios.get(`${apiUrl}/api/locations`); setLocations(res.data); } catch (err) { console.error("Failed locations:", err); setError(prev => prev ? `${prev} Failed locations.` : `Failed locations: ${err.message}`); } finally { setLocationLoading(false); }
        };
        fetchLocations();
    }, []);

    // --- Filter logic (Unchanged) ---
    const filteredStudents = students.filter(student => { /* ... */ const gm = gradeFilter === 'All' || student.grade === gradeFilter; const lm = locationFilter === 'All' || student.location === locationFilter; return gm && lm; });

    // --- Modal Handlers (Unchanged) ---
    const handleEditClick = (student) => { setEditingStudent(student); setShowModal(true); };
    const handleCloseModal = () => { setShowModal(false); setEditingStudent(null); };
    const handleModalChange = (e) => { setEditingStudent({ ...editingStudent, [e.target.name]: e.target.value }); };
    const handleUpdateStudent = async (e) => { /* ... unchanged ... */ e.preventDefault(); if (!editingStudent) return; try { const apiUrl = process.env.REACT_APP_API_URL; if (!apiUrl) throw new Error("API URL not configured."); const { _id, studentId, __v, createdAt, updatedAt, ...updateData } = editingStudent; const res = await axios.patch(`${apiUrl}/api/students/${_id}`, updateData); setStudents(s => s.map(st => (st._id === editingStudent._id ? res.data : st))); handleCloseModal(); } catch (err) { console.error("Error updating:", err); alert(`Failed update: ${err.response?.data?.message || err.message}`); } };
    const handleDeactivateClick = async (studentMongoId) => { /* ... unchanged ... */ if (window.confirm('Deactivate?')) { try { const apiUrl = process.env.REACT_APP_API_URL; if (!apiUrl) throw new Error("API URL not configured."); await axios.delete(`${apiUrl}/api/students/${studentMongoId}`); onListRefresh(); } catch (err) { console.error("Error deactivate:", err); alert(`Failed deactivate: ${err.response?.data?.message || err.message}`); } } };
    const handleShowQrModal = (student) => { setQrStudent(student); setShowQrModal(true); };
    const handleCloseQrModal = () => { setShowQrModal(false); setQrStudent(null); };

    // --- NEW: Download Handler ---
    const handleDownload = () => {
        if (qrCodeRef.current === null) {
            return;
        }

        toJpeg(qrCodeRef.current, { cacheBust: true, quality: 0.98, backgroundColor: 'white' })
            .then((dataUrl) => {
                // Create a temporary link to trigger the download
                const link = document.createElement('a');
                link.download = `${qrStudent.name}-${qrStudent.studentId}-ID.jpg`;
                link.href = dataUrl;
                link.click(); // Trigger the download
            })
            .catch((err) => {
                console.error('oops, something went wrong!', err);
                alert('Could not download image.');
            });
    };

    // --- Render Logic ---
    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
    if (error && students.length === 0 && !loading) { return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>; }

    return (
        <>
            <Card className="mt-4">
                {/* ... (Card Header, Body, Filters, and Table are unchanged) ... */}
                <Card.Header><Card.Title as="h2" className="mb-0">Student List</Card.Title></Card.Header>
                <Card.Body>
                     {error && students.length > 0 && <Alert variant="warning">{error.includes("locations") ? "Failed locations." : error }</Alert>}
                    <Form className="mb-3"> <Row> <Col md={4}> <Form.Group><Form.Label>Grade</Form.Label> <Form.Select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}> <option value="All">All Grades</option> <option value="Grade 6">Grade 6</option> <option value="Grade 7">Grade 7</option> <option value="Grade 8">Grade 8</option> <option value="Grade 9">Grade 9</option> <option value="Grade 10">Grade 10</option> <option value="Grade 11">Grade 11</option> </Form.Select> </Form.Group> </Col> <Col md={4}> <Form.Group><Form.Label>Location</Form.Label> <Form.Select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} disabled={locationLoading}> <option value="All">All Locations</option> {locationLoading ? (<option>...</option>) : ( locations.map(loc => (<option key={loc._id} value={loc.name}>{loc.name}</option>)) )} </Form.Select> </Form.Group> </Col> </Row> </Form>
                    <Table striped bordered hover responsive>
                        <thead><tr><th>Student ID</th><th>Student Name</th><th>Grade</th><th>Location</th><th>Contact Phone</th><th>Parent's Name</th><th>Actions</th></tr></thead>
                        <tbody>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map(student => (
                                    <tr key={student._id}>
                                        <td>{student.studentId || 'N/A'}</td>
                                        <td>{student.name}</td>
                                        <td><Badge bg="primary">{student.grade}</Badge></td>
                                        <td><Badge bg="secondary">{student.location}</Badge></td>
                                        <td>{student.contactPhone || '-'}</td>
                                        <td>{student.parentName || '-'}</td>
                                        <td>
                                            <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => handleShowQrModal(student)} title="Show QR Code"><FaQrcode /></Button>
                                            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEditClick(student)} title="Edit"><FaEdit /></Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeactivateClick(student._id)} title="Deactivate"><FaTrashAlt /></Button>
                                        </td>
                                    </tr>
                                ))
                            ) : ( <tr> <td colSpan="7" className="text-center">No students found.</td> </tr> )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* --- EDIT STUDENT MODAL (Unchanged) --- */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                 <Modal.Header closeButton> <Modal.Title>Edit Student</Modal.Title> </Modal.Header>
                 <Modal.Body>
                    {editingStudent && ( <Form onSubmit={handleUpdateStudent}> <Form.Group className="mb-3"><Form.Label>Student ID</Form.Label><Form.Control type="text" value={editingStudent.studentId || 'N/A'} readOnly disabled /></Form.Group> <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control type="text" name="name" value={editingStudent.name} onChange={handleModalChange} required /></Form.Group> <Row> <Col md={6}> <Form.Group className="mb-3"><Form.Label>Grade</Form.Label> <Form.Select name="grade" value={editingStudent.grade} onChange={handleModalChange}> <option value="Grade 6">Grade 6</option> <option value="Grade 7">Grade 7</option> <option value="Grade 8">Grade 8</option> <option value="Grade 9">Grade 9</option> <option value="Grade 10">Grade 10</option> <option value="Grade 11">Grade 11</option> </Form.Select> </Form.Group> </Col> <Col md={6}> <Form.Group className="mb-3"><Form.Label>Location</Form.Label> <Form.Select name="location" value={editingStudent.location} onChange={handleModalChange} disabled={locationLoading}> {locationLoading ? (<option>...</option>) : ( locations.map(loc => (<option key={loc._id} value={loc.name}>{loc.name}</option>)) )} </Form.Select> </Form.Group> </Col> </Row> <Form.Group className="mb-3"><Form.Label>Phone</Form.Label><Form.Control type="text" name="contactPhone" value={editingStudent.contactPhone || ''} onChange={handleModalChange} /></Form.Group> <Form.Group className="mb-3"><Form.Label>Parent's Name</Form.Label><Form.Control type="text" name="parentName" value={editingStudent.parentName || ''} onChange={handleModalChange} /></Form.Group> <Button variant="primary" type="submit"> Save Changes </Button> </Form> )}
                 </Modal.Body>
            </Modal>

            {/* --- MODIFIED: QR CODE MODAL --- */}
            <Modal show={showQrModal} onHide={handleCloseQrModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>QR Code for {qrStudent?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    {qrStudent?.studentId ? (
                        <>
                            {/* --- THIS IS THE WRAPPER WE DOWNLOAD --- */}
                            <div ref={qrCodeRef} style={{ background: 'white', padding: '16px', display: 'inline-block' }}>
                                <QRCode
                                    value={qrStudent.studentId}
                                    size={256}
                                    viewBox={`0 0 256 256`}
                                />
                                <h4 className="mt-3">{qrStudent.name}</h4>
                                <p className="fs-5 text-muted">ID: {qrStudent.studentId}</p>
                            </div>
                            {/* --- END WRAPPER --- */}
                            
                            <div className="mt-3"> {/* Moved buttons outside the download ref */}
                                <Button variant="primary" onClick={handleDownload} className="me-2">
                                    Download as JPG
                                </Button>
                           
                            </div>
                        </>
                    ) : (
                        <Alert variant="warning">This student does not have a 4-digit ID assigned yet. Please edit the student to ensure they have one.</Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseQrModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default StudentList;