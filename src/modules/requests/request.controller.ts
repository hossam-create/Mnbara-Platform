import { Request, Response } from 'express';

// Dummy data to hold requests temporarily
let requests = [];

// Controller for creating a request
export const createRequest = (req: Request, res: Response) => {
    const newRequest = { id: requests.length + 1, ...req.body };
    requests.push(newRequest);
    res.status(201).json(newRequest);
};

// Controller for accepting a request
export const acceptRequest = (req: Request, res: Response) => {
    const { id } = req.params;
    const requestIndex = requests.findIndex(r => r.id === parseInt(id));
    if (requestIndex !== -1) {
        requests[requestIndex].status = 'accepted';
        res.status(200).json(requests[requestIndex]);
    } else {
        res.status(404).json({ message: 'Request not found' });
    }
};

// Controller for completing a request
export const completeRequest = (req: Request, res: Response) => {
    const { id } = req.params;
    const requestIndex = requests.findIndex(r => r.id === parseInt(id));
    if (requestIndex !== -1) {
        requests[requestIndex].status = 'completed';
        res.status(200).json(requests[requestIndex]);
    } else {
        res.status(404).json({ message: 'Request not found' });
    }
};

// Controller for canceling a request
export const cancelRequest = (req: Request, res: Response) => {
    const { id } = req.params;
    const requestIndex = requests.findIndex(r => r.id === parseInt(id));
    if (requestIndex !== -1) {
        requests.splice(requestIndex, 1);
        res.status(204).send(); // No content
    } else {
        res.status(404).json({ message: 'Request not found' });
    }
};

// Sample express route setup
// import express from 'express';
// const router = express.Router();
// router.post('/requests', createRequest);
// router.patch('/requests/:id/accept', acceptRequest);
// router.patch('/requests/:id/complete', completeRequest);
// router.delete('/requests/:id', cancelRequest);
// export default router;
