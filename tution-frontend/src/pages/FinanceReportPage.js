import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Card, Table, Spinner, Alert, Badge } from 'react-bootstrap';

const months = ["All", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const years = ["All", new Date().getFullYear(), new Date().getFullYear() - 1];

function FinanceReportPage() {
    const [month, setMonth] = useState('All');
    const [year, setYear] = useState(new Date().getFullYear());
    const [grade, setGrade] = useState('All');
    const [location, setLocation] = useState('All');

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [locations, setLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);

    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchLocations = async () => {
            setLocationLoading(true);
            setError('');
            try {
                if (!apiUrl) throw new Error("API URL is not configured.");
                const res = await axios.get(`${apiUrl}/api/locations`);
                setLocations(res.data);
            } catch (err) {
                console.error("Failed to fetch locations:", err);
                setError(`Failed to load locations list: ${err.message}`);
            } finally {
                setLocationLoading(false);
            }
        };
        fetchLocations();
    }, [apiUrl]);

    const loadFinanceReport = async () => {
        setLoading(true);
        setError('');
        setReportData(null);
        try {
            if (!apiUrl) throw new Error("API URL is not configured.");
            const response = await axios.get(`${apiUrl}/api/reports/finance`, {
                params: { month, year, grade, location }
            });
            setReportData(response.data);
        } catch (err) {
            console.error("Error loading finance report:", err);
            setError(`Error loading finance report: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid className="mt-4 pb-5">
            <Card className="mb-4 shadow-sm border-0">
                <Card.Body>
                    <Card.Title className="fw-bold mb-3">Finance & Income Reports</Card.Title>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form>
                        <Row className="g-2">
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">MONTH</Form.Label>
                                    <Form.Select value={month} onChange={(e) => setMonth(e.target.value)}>
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">YEAR</Form.Label>
                                    <Form.Select value={year} onChange={(e) => setYear(e.target.value)}>
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">GRADE</Form.Label>
                                    <Form.Select value={grade} onChange={(e) => setGrade(e.target.value)}>
                                        <option value="All">All Grades</option>
                                        <option value="Grade 6">Grade 6</option>
                                        <option value="Grade 7">Grade 7</option>
                                        <option value="Grade 8">Grade 8</option>
                                        <option value="Grade 9">Grade 9</option>
                                        <option value="Grade 10">Grade 10</option>
                                        <option value="Grade 11">Grade 11</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">LOCATION</Form.Label>
                                    <Form.Select value={location} onChange={(e) => setLocation(e.target.value)} disabled={locationLoading}>
                                        <option value="All">All Locations</option>
                                        {!locationLoading && locations.map(loc => <option key={loc._id} value={loc.name}>{loc.name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2} className="d-flex align-items-end">
                                <Button onClick={loadFinanceReport} className="w-100 fw-bold" variant="primary" disabled={loading || locationLoading}>
                                    {loading ? <Spinner as="span" size="sm" animation="border" /> : 'Get Report'}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {loading && <div className="text-center my-5"><Spinner animation="grow" variant="primary" /></div>}

            {reportData && (
                <>
                    {/* --- ROW 1: SUMMARY CARDS (5 Equal Size Cards) --- */}
<Row className="mb-4 g-3 row-cols-1 row-cols-md-3 row-cols-lg-5">
    
    {/* 1. Gross Income */}
    <Col>
        <Card className="text-center shadow-sm border-0 h-100">
            <Card.Header className="bg-dark text-white py-1 small fw-bold">Gross Income</Card.Header>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                <h5 className="mb-0">{(reportData.grandTotal?.totalGross || 0).toLocaleString()}</h5>
            </Card.Body>
        </Card>
    </Col>

    {/* 2. Hall Fees */}
    <Col>
        <Card className="text-center shadow-sm border-0 h-100">
            <Card.Header className="bg-danger text-white py-1 small fw-bold">Hall Fees</Card.Header>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center text-danger">
                <h5 className="mb-0">-{(reportData.grandTotal?.totalFees || 0).toLocaleString()}</h5>
            </Card.Body>
        </Card>
    </Col>

    {/* 3. Net Profit */}
    <Col>
        <Card className="text-center shadow-sm border-0 h-100 border-bottom border-success border-4">
            <Card.Header className="bg-success text-white py-1 small fw-bold">Net Profit</Card.Header>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center text-success">
                <h5 className="mb-0 fw-bold">{(reportData.grandTotal?.totalNet || 0).toLocaleString()}</h5>
            </Card.Body>
        </Card>
    </Col>

    {/* 4. Paid Count */}
    <Col>
        <Card className="text-center shadow-sm border-0 h-100">
            <Card.Header className="bg-primary text-white py-1 small fw-bold">Paid Count</Card.Header>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                <h5 className="mb-0">{reportData.grandTotal?.totalStudentsPaid || 0}</h5>
            </Card.Body>
        </Card>
    </Col>

    {/* 5. Unpaid Count */}
    <Col>
        <Card className="text-center shadow-sm border-0 h-100 border-bottom border-danger border-4">
            <Card.Header className="bg-white text-danger py-1 small fw-bold">Unpaid Count</Card.Header>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center text-danger">
                <h5 className="mb-0 fw-bold">{reportData.unpaidCount || 0}</h5>
            </Card.Body>
        </Card>
    </Col>
</Row>

                    {/* --- ROW 2: DETAILED BREAKDOWN TABLE --- */}
                    <Card className="mb-4 shadow-sm border-0">
                        <Card.Header className="bg-light fw-bold">Class-wise Income Breakdown</Card.Header>
                        <Card.Body className="p-0">
                            <Table striped hover responsive className="mb-0 align-middle">
                                <thead className="table-dark">
                                    <tr>
                                        <th>Period</th>
                                        <th>Class / Location</th>
                                        <th className="text-center">Paid</th>
                                        <th>Gross (LKR)</th>
                                        <th className="text-danger">Hall Fee</th>
                                        <th className="fw-bold text-success">Net Income</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.breakdown?.length > 0 ? reportData.breakdown.map((item, index) => (
                                        <tr key={index}>
                                            <td className="small">{item._id.month} {item._id.year}</td>
                                            <td>
                                                <Badge bg="primary" className="me-1">{item._id.grade}</Badge>
                                                <Badge bg="secondary" pill>{item._id.location}</Badge>
                                            </td>
                                            <td className="text-center">{item.studentsPaid}</td>
                                            <td>{(item.grossIncome || 0).toLocaleString()}</td>
                                            <td className="text-danger">-{(item.totalFees || 0).toLocaleString()}</td>
                                            <td className="fw-bold text-success">{(item.netIncome || 0).toLocaleString()}</td>
                                        </tr>
                                    )) : <tr><td colSpan="6" className="text-center p-4 text-muted">No financial records found for the selected filters.</td></tr>}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>

                    {/* --- ROW 3: UNPAID STUDENTS DETAILED TABLE --- */}
                    {reportData.unpaidStudents?.length > 0 && (
                        <Card className="shadow-sm border-0">
                            <Card.Header className="bg-danger text-white d-flex justify-content-between align-items-center">
                                <span className="fw-bold">Pending Payments</span>
                                <Badge bg="light" text="dark">{reportData.unpaidCount} Students</Badge>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <Table striped hover responsive className="mb-0">
                                    <thead className="table-danger small text-uppercase">
                                        <tr>
                                            <th>ID</th>
                                            <th>Student Name</th>
                                            <th>Grade</th>
                                            <th>Location</th>
                                            <th>Contact Number</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.unpaidStudents.map((st) => (
                                            <tr key={st._id}>
                                                <td className="fw-bold text-muted">{st.studentId}</td>
                                                <td>{st.name}</td>
                                                <td>{st.grade}</td>
                                                <td>{st.location}</td>
                                                <td>{st.contactPhone || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    )}
                </>
            )}

            {!loading && !reportData && !error && (
                <div className="text-center mt-5">
                    <Alert variant="info" className="d-inline-block shadow-sm">
                        Please select your filters above and click <strong>Get Report</strong> to view the financial breakdown.
                    </Alert>
                </div>
            )}
        </Container>
    );
}

export default FinanceReportPage;