import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Spinner, Alert, ListGroup } from 'react-bootstrap';

// --- IMPORTS ---
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { BsPeopleFill, BsPersonCheckFill, BsClockHistory } from 'react-icons/bs';
import { FaDollarSign, FaRegCalendarAlt, FaHandHoldingUsd } from 'react-icons/fa';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

function DashboardPage() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchDashboardData = async () => {
            setError('');
            setLoading(true);
            try {
                if (!apiUrl) {
                    setError("API URL configuration error. Please check environment variables.");
                    setLoading(false);
                    return;
                }
                const response = await axios.get(`${apiUrl}/api/dashboard`);
                setDashboardData(response.data);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError('Error fetching dashboard data. Please check backend connection.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [apiUrl]);

    // --- Chart Helpers ---
    const prepareGradeChartData = () => {
        if (!dashboardData || !dashboardData.totalStudentsByGrade) return {};
        const labels = dashboardData.totalStudentsByGrade.map(item => item._id);
        const data = dashboardData.totalStudentsByGrade.map(item => item.count);
        return {
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } },
            data: { labels, datasets: [{ label: 'Students per Grade', data, backgroundColor: 'rgba(54, 162, 235, 0.8)', borderRadius: 4 }] }
        };
    };

    const preparePaymentDoughnutData = () => {
        if (!dashboardData || !dashboardData.paymentStatusThisMonth) return {};
        const labels = dashboardData.paymentStatusThisMonth.map(item => item._id);
        const data = dashboardData.paymentStatusThisMonth.map(item => item.count);
        return {
            options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom' } } },
            data: { labels, datasets: [{ label: 'Payment Status', data, backgroundColor: ['rgba(75, 192, 192, 0.8)', 'rgba(255, 206, 86, 0.8)', 'rgba(255, 99, 132, 0.8)'], borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)', 'rgba(255, 99, 132, 1)'], borderWidth: 1 }] }
        };
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
    if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
    if (!dashboardData) return <Container className="mt-5"><Alert variant="warning">No dashboard data loaded.</Alert></Container>;

    const totalPending = dashboardData.paymentStatusThisMonth?.find(s => s._id === 'Pending')?.count || 0;
    const gradeChart = prepareGradeChartData();
    const paymentChart = preparePaymentDoughnutData();

    return (
        <Container fluid className="mt-4 pb-5">
            <Row className="mb-4">
                <Col>
                    <h2>Dashboard Overview</h2>
                    <p className="text-muted">Real-time stats for your science classes.</p>
                </Col>
            </Row>

            {/* --- ROW 1: CORE STATS --- */}
            <Row className="mb-4">
                <Col lg={4} md={6} className="mb-3">
                    <Card bg="primary" text="white" className="shadow border-0 h-100">
                        <Card.Body className="d-flex align-items-center">
                            <BsPeopleFill className="fs-1 me-4" />
                            <div>
                                <div className="fs-6">Total Active Students</div>
                                <div className="fs-2 fw-bold">{dashboardData.totalStudents ?? '0'}</div>
                            </div>
                        </Card.Body>
                        {dashboardData.totalStudentsByGrade?.length > 0 && (
                            <ListGroup variant="flush">
                                {dashboardData.totalStudentsByGrade.map(item => (
                                    <ListGroup.Item key={item._id} className="d-flex justify-content-between align-items-center text-dark py-1">
                                        <small>{item._id}</small><span className="badge bg-primary rounded-pill">{item.count}</span>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </Card>
                </Col>
                <Col lg={4} md={6} className="mb-3">
                    <Card bg="success" text="white" className="shadow border-0 h-100">
                        <Card.Body className="d-flex align-items-center">
                            <BsPersonCheckFill className="fs-1 me-4" />
                            <div>
                                <div className="fs-6">Students Present Today</div>
                                <div className="fs-2 fw-bold">{dashboardData.presentToday ?? '0'}</div>
                            </div>
                        </Card.Body>
                        {dashboardData.presentTodayByGrade?.length > 0 && (
                            <ListGroup variant="flush">
                                {dashboardData.presentTodayByGrade.map(item => (
                                    <ListGroup.Item key={item._id} className="d-flex justify-content-between align-items-center text-dark py-1">
                                        <small>{item._id}</small><span className="badge bg-success rounded-pill">{item.count}</span>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </Card>
                </Col>
                <Col lg={4} md={6} className="mb-3">
                    <Card bg="warning" text="dark" className="shadow border-0 h-100">
                        <Card.Body className="d-flex align-items-center">
                            <BsClockHistory className="fs-1 me-4" />
                            <div>
                                <div className="fs-6">Pending Payments</div>
                                <div className="fs-2 fw-bold">{totalPending}</div>
                            </div>
                        </Card.Body>
                        {dashboardData.pendingPaymentsByGrade?.length > 0 && (
                            <ListGroup variant="flush">
                                {dashboardData.pendingPaymentsByGrade.map(item => (
                                    <ListGroup.Item key={item._id} className="d-flex justify-content-between align-items-center text-dark py-1">
                                        <small>{item._id}</small><span className="badge bg-warning text-dark rounded-pill">{item.count}</span>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* --- ROW 2: INCOME STATS WITH BREAKDOWN --- */}
            <Row className="mb-4">
                <Col md={6} className="mb-3">
                    <Card className="shadow border-0 h-100 overflow-hidden">
                        <div className="bg-info p-3 text-white d-flex align-items-center">
                            <FaDollarSign className="fs-3 me-3" />
                            <span className="fw-bold">Income Breakdown (This Month)</span>
                        </div>
                        <Card.Body className="bg-light">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Total Collected:</span>
                                <span className="fw-bold text-dark">LKR {(dashboardData.incomeThisMonth?.gross ?? 0).toLocaleString()}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 text-danger">
                                <span className="text-muted">Hall Fees Paid:</span>
                                <span className="fw-bold">- LKR {(dashboardData.incomeThisMonth?.fees ?? 0).toLocaleString()}</span>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="fs-6 fw-bold">Net Profit:</span>
                                <span className="fs-3 fw-bold text-primary">LKR {(dashboardData.incomeThisMonth?.net ?? 0).toLocaleString()}</span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} className="mb-3">
                    <Card className="shadow border-0 h-100 overflow-hidden">
                        <div className="bg-dark p-3 text-white d-flex align-items-center">
                            <FaRegCalendarAlt className="fs-3 me-3" />
                            <span className="fw-bold">Income Breakdown (This Year)</span>
                        </div>
                        <Card.Body className="bg-light">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Yearly Collected:</span>
                                <span className="fw-bold text-dark">LKR {(dashboardData.incomeThisYear?.gross ?? 0).toLocaleString()}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 text-danger">
                                <span className="text-muted">Total Hall Fees:</span>
                                <span className="fw-bold">- LKR {(dashboardData.incomeThisYear?.fees ?? 0).toLocaleString()}</span>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="fs-6 fw-bold">Yearly Net Profit:</span>
                                <span className="fs-3 fw-bold text-success">LKR {(dashboardData.incomeThisYear?.net ?? 0).toLocaleString()}</span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* --- ROW 3: CHARTS --- */}
            <Row>
                <Col md={8} className="mb-3">
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body>
                            <Card.Title className="mb-4">Students by Grade</Card.Title>
                            {gradeChart.data?.datasets?.length > 0 ? (
                                <div style={{ height: '350px' }}>
                                    <Bar data={gradeChart.data} options={gradeChart.options} />
                                </div>
                            ) : (<p className="text-center mt-5 text-muted">No student data available for chart.</p>)}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4} className="mb-3">
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body>
                            <Card.Title className="mb-4">Payment Status (This Month)</Card.Title>
                            {paymentChart.data?.datasets?.length > 0 ? (
                                <div style={{ height: '350px' }}>
                                    <Doughnut data={paymentChart.data} options={paymentChart.options} />
                                </div>
                            ) : (<p className="text-center mt-5 text-muted">No payment data available for chart.</p>)}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default DashboardPage;