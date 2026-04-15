"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { studentAPI, enquiryAPI } from "@/lib/api";
import { useEffect } from "react";
import { studentRegistrationSchema, StudentRegistrationValues } from "@/lib/validators/student";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Sub-components will be imported here (creating placeholders for now)
import BasicDetails from "./BasicDetails";
import AcademicDetails from "./AcademicDetails";
import ParentDetails from "./ParentDetails";
import AddressDetails from "./AddressDetails";
import PreviousSchoolDetails from "./PreviousSchoolDetails";
import FeeDetails from "./FeeDetails";
import RegistrationSummary from "./RegistrationSummary";

export default function RegistrationForm() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("basic");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<any>({
        resolver: zodResolver(studentRegistrationSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            dateOfBirth: "",
            gender: "MALE",
            nationality: "Indian",
            admissionDate: new Date().toISOString().split('T')[0],
            classId: "",
            sectionId: "",
            academicYearId: "",
            admissionType: "NEW",
            medium: "ENGLISH",
            fatherName: "",
            fatherPhone: "",
            currentAddress: "",
            city: "",
            state: "",
            pincode: "",
            feeStructureIds: [],
            feeDiscounts: {},
        },
        mode: "onChange",
    });

    const searchParams = useSearchParams();
    const enquiryId = searchParams.get('enquiryId');

    useEffect(() => {
        if (enquiryId) {
            const fetchEnquiry = async () => {
                try {
                    const res = await enquiryAPI.getById(enquiryId);
                    if (res.success && res.enquiry) {
                        const { enquiry } = res;
                        // Split student name if possible, otherwise put in firstName
                        const names = enquiry.studentName.split(' ');
                        const firstName = names[0];
                        const lastName = names.slice(1).join(' ') || '.';

                        form.reset({
                            ...form.getValues(),
                            firstName,
                            lastName,
                            fatherName: enquiry.parentName,
                            fatherPhone: enquiry.phone,
                            email: enquiry.email || "",
                            classId: enquiry.classId,
                            academicYearId: enquiry.academicYearId,
                        });
                        toast.info("Form pre-filled from enquiry data");
                    }
                } catch (err) {
                    
                }
            };
            fetchEnquiry();
        }
    }, [enquiryId, form]);

    const onSubmit = async (data: StudentRegistrationValues) => {
        setIsSubmitting(true);
        try {
            const result = await studentAPI.register(data);
            if (result.success) {
                toast.success("Student registered successfully!");

                // If converted from enquiry, update enquiry status
                if (enquiryId) {
                    await enquiryAPI.update(enquiryId, {
                        status: 'CONVERTED',
                        isConverted: true,
                        convertedAt: new Date().toISOString(),
                        convertedStudentId: result.data.student.id
                    }).catch(console.error);
                }

                router.push(`/dashboard/students/${result.data.student.id}`);
            } else {
                toast.error("Registration failed: " + (result.message || "Unknown error"));
            }
        } catch (error: any) {
            console.error("Registration error:", error);
            toast.error(error.response?.data?.error || "Failed to register student");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Function to validate current step before moving
    const handleNext = async (currentTab: string, nextTab: string, fields: (keyof StudentRegistrationValues)[]) => {
        const output = await form.trigger(fields);
        if (output) {
            setActiveTab(nextTab);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-7">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="academic">Academic</TabsTrigger>
                        <TabsTrigger value="parents">Parents</TabsTrigger>
                        <TabsTrigger value="address">Address</TabsTrigger>
                        <TabsTrigger value="previous">Previous School</TabsTrigger>
                        <TabsTrigger value="fees">Fees</TabsTrigger>
                        <TabsTrigger value="confirm">Confirm</TabsTrigger>
                    </TabsList>

                    <div className="mt-4">
                        <TabsContent value="basic">
                            <BasicDetails form={form} onNext={() => handleNext("basic", "academic", ["firstName", "lastName", "dateOfBirth", "gender"])} />
                        </TabsContent>

                        <TabsContent value="academic">
                            <AcademicDetails form={form} onNext={() => handleNext("academic", "parents", ["classId", "sectionId", "academicYearId"])} onPrev={() => setActiveTab("basic")} />
                        </TabsContent>

                        <TabsContent value="parents">
                            <ParentDetails form={form} onNext={() => handleNext("parents", "address", ["fatherName", "fatherPhone"])} onPrev={() => setActiveTab("academic")} />
                        </TabsContent>

                        <TabsContent value="address">
                            <AddressDetails form={form} onNext={() => handleNext("address", "previous", ["currentAddress", "city", "state", "pincode"])} onPrev={() => setActiveTab("parents")} />
                        </TabsContent>

                        <TabsContent value="previous">
                            <PreviousSchoolDetails form={form} />
                            <div className="flex justify-between mt-4">
                                <Button type="button" variant="outline" onClick={() => setActiveTab("address")}>Previous</Button>
                                <Button type="button" onClick={() => setActiveTab("fees")}>Next: Fee Details</Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="fees">
                            <FeeDetails form={form} onNext={() => setActiveTab("confirm")} onPrev={() => setActiveTab("previous")} />
                        </TabsContent>

                        <TabsContent value="confirm">
                            <div className="space-y-4">
                                <RegistrationSummary form={form} />
                                <div className="flex justify-end space-x-2">
                                    <Button type="button" variant="outline" onClick={() => setActiveTab("fees")}>Back</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Register Student
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </form>
        </Form>
    );
}
