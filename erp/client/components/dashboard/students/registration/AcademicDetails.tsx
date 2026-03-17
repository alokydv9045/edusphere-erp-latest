"use client";

import { UseFormReturn } from "react-hook-form";
import { StudentRegistrationValues } from "@/lib/validators/student";
import { useAcademicData } from "@/hooks/useAcademicData";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AcademicDetailsProps {
    form: UseFormReturn<StudentRegistrationValues>;
    onNext: () => void;
    onPrev: () => void;
}

export default function AcademicDetails({ form, onNext, onPrev }: AcademicDetailsProps) {
    const selectedClassId = form.watch("classId");
    
    const { 
        classes, 
        sections, 
        academicYears, 
        loading 
    } = useAcademicData(selectedClassId);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Academic Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="admissionType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Admission Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="NEW">New Admission</SelectItem>
                                        <SelectItem value="TRANSFER">Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="admissionDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Admission Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="academicYearId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Academic Year <span className="text-red-500">*</span></FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={loading ? "Loading..." : "Select Academic Year"} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {academicYears.map((year) => (
                                            <SelectItem key={year.id} value={year.id}>
                                                {year.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="medium"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Medium</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Medium" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="ENGLISH">English</SelectItem>
                                        <SelectItem value="HINDI">Hindi</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="classId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Class <span className="text-red-500">*</span></FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={loading ? "Loading..." : "Select Class"} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {classes.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="sectionId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Section <span className="text-red-500">*</span></FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedClassId || loading}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={!selectedClassId ? "Select Class first" : (loading ? "Loading..." : "Select Section")} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {sections.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={onPrev}>Previous</Button>
                    <Button type="button" onClick={onNext}>Next: Parent Details</Button>
                </div>
            </CardContent>
        </Card>
    );
}
